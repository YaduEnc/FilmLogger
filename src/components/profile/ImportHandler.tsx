import { useState, useCallback } from "react";
import Papa from "papaparse";
import { cn } from "@/lib/utils";
import { Loader2, Upload, FileCheck, X, CheckCircle2, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { searchMovies, getMovieDetails } from "@/lib/tmdb";
import { createLogEntry, toggleWatchlist, toggleFavorite, createCustomList, addMovieToList } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ImportRow {
    Date?: string;
    Name?: string;
    Year?: string;
    Rating?: string;
    Review?: string;
    Rewatch?: string;
    [key: string]: any;
}

interface MatchResult {
    row: ImportRow;
    status: 'pending' | 'matching' | 'matched' | 'unmatched' | 'error';
    matchedMovie?: any;
    error?: string;
}

export function ImportHandler() {
    const { user } = useAuth();
    const [files, setFiles] = useState<{ diary: File | null; watchlist: File | null; likes: File | null; lists: File[] }>({
        diary: null,
        watchlist: null,
        likes: null,
        lists: []
    });
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<MatchResult[]>([]);

    const handleFileChange = (type: string, file: File | File[] | null) => {
        setFiles(prev => {
            if (type === 'lists') {
                return { ...prev, lists: Array.isArray(file) ? file : (file ? [file] : []) };
            }
            return { ...prev, [type]: file as File | null };
        });
    };

    const parseCSV = (file: File): Promise<ImportRow[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                const lines = text.split(/\r?\n/);

                // Find the actual header row (some Letterboxd exports have a preamble)
                // We look for a row that contains both 'Name' and 'Year'
                const headerIndex = lines.findIndex(line => {
                    const lowerLine = line.toLowerCase();
                    return lowerLine.includes('name') && (lowerLine.includes('year') || lowerLine.includes('rating'));
                });

                const csvContent = headerIndex !== -1 ? lines.slice(headerIndex).join('\n') : text;

                Papa.parse(csvContent, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => resolve(results.data as ImportRow[]),
                    error: (error) => reject(error)
                });
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    };

    const startImport = async () => {
        if (!user) return;
        setImporting(true);
        setProgress(0);
        setResults([]); // Reset previous results

        try {
            let allRows: { type: string; data: ImportRow[]; listName?: string }[] = [];

            if (files.diary) {
                const diaryData = await parseCSV(files.diary);
                allRows.push({ type: 'diary', data: diaryData });
            }

            if (files.watchlist) {
                const watchlistData = await parseCSV(files.watchlist);
                allRows.push({ type: 'watchlist', data: watchlistData });
            }

            if (files.likes) {
                const likesData = await parseCSV(files.likes);
                allRows.push({ type: 'likes', data: likesData });
            }

            for (const listFile of files.lists) {
                const listData = await parseCSV(listFile);
                // Try to clean name from filename (e.g. "my-list.csv" -> "My List")
                const cleanName = listFile.name.replace('.csv', '').replace(/-/g, ' ').replace(/_/g, ' ')
                    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                allRows.push({ type: 'list', data: listData, listName: cleanName });
            }

            if (allRows.length === 0) {
                toast.error("Please select at least one file to import.");
                setImporting(false);
                return;
            }

            // Initial results state - Filter out empty rows or rows without a movie name
            const initialResults: MatchResult[] = allRows.flatMap(item =>
                item.data
                    .filter(row => row.Name && row.Name.trim().length > 0)
                    .map(row => ({
                        row: { ...row, _importType: item.type, _listName: item.listName },
                        status: 'pending' as const
                    }))
            );

            if (initialResults.length === 0) {
                toast.error("No valid entries found in the selected files.");
                setImporting(false);
                return;
            }

            setResults(initialResults);

            // Map to track created lists by name to avoid duplicates during a single session if somehow re-triggered
            const createdListIds: Record<string, string> = {};

            // Process rows in chunks to respect TMDB API limits
            const CONCURRENCY_LIMIT = 3;
            let processed = 0;
            const total = initialResults.length;

            const reconcileRow = async (rowIndex: number) => {
                const item = initialResults[rowIndex];
                setResults(prev => {
                    const next = [...prev];
                    next[rowIndex] = { ...next[rowIndex], status: 'matching' };
                    return next;
                });

                try {
                    // 1. Search TMDB (First try with year for accuracy)
                    const searchYear = parseInt(item.row.Year || "0");
                    let searchResponse = await searchMovies(item.row.Name || "", 1, searchYear);
                    let movies = searchResponse.movies;

                    // 2. Fallback: Search without year if no results
                    if (movies.length === 0) {
                        searchResponse = await searchMovies(item.row.Name || "", 1);
                        movies = searchResponse.movies;
                    }

                    // 3. Fuzzy Match
                    const normalizedLBTitle = (item.row.Name || "").toLowerCase().trim();
                    const bestMatch = movies.find(m => {
                        const normalizedTMDBTitle = m.title.toLowerCase().trim();
                        const yearDiff = Math.abs(m.year - searchYear);
                        return normalizedTMDBTitle === normalizedLBTitle && (searchYear === 0 || yearDiff <= 1);
                    }) || movies[0];

                    if (!bestMatch) {
                        throw new Error("No match found");
                    }

                    // 4. Fetch Full Details
                    const fullMovie = await getMovieDetails(bestMatch.id);

                    setResults(prev => {
                        const next = [...prev];
                        next[rowIndex] = { ...next[rowIndex], status: 'matched', matchedMovie: fullMovie };
                        return next;
                    });

                    // 5. Persistence based on Type
                    if (item.row._importType === 'diary') {
                        await createLogEntry(user.uid, {
                            movieId: fullMovie.id,
                            movie: fullMovie,
                            rating: parseFloat(item.row.Rating || "0") * 2,
                            reviewShort: item.row.Review || "",
                            watchedDate: item.row.Date || new Date().toISOString(),
                            mediaType: 'movie',
                            visibility: 'public',
                            tags: [],
                            isRewatch: item.row.Rewatch === 'Yes',
                            rewatchCount: item.row.Rewatch === 'Yes' ? 1 : 0
                        });
                    } else if (item.row._importType === 'watchlist') {
                        await toggleWatchlist(user.uid, fullMovie);
                    } else if (item.row._importType === 'likes') {
                        await toggleFavorite(user.uid, fullMovie);
                    } else if (item.row._importType === 'list' && item.row._listName) {
                        let listId = createdListIds[item.row._listName];
                        if (!listId) {
                            listId = await createCustomList(user.uid, item.row._listName, "Imported from Letterboxd");
                            createdListIds[item.row._listName] = listId;
                        }
                        await addMovieToList(user.uid, listId, fullMovie);
                    }

                } catch (error) {
                    console.error(`Reconciliation error for ${item.row.Name}:`, error);
                    setResults(prev => {
                        const next = [...prev];
                        next[rowIndex] = { ...next[rowIndex], status: 'error', error: "System match failed" };
                        return next;
                    });
                } finally {
                    processed++;
                    setProgress((processed / total) * 100);
                }
            };

            // Execute processing queue
            for (let i = 0; i < total; i += CONCURRENCY_LIMIT) {
                const chunk = Array.from({ length: Math.min(CONCURRENCY_LIMIT, total - i) }, (_, k) => i + k);
                await Promise.all(chunk.map(reconcileRow));
            }

            const matchedCount = results.filter(r => r.status === 'matched').length;
            const errorCount = results.filter(r => r.status === 'error' || r.status === 'unmatched').length;

            toast.success(`Migration complete: ${matchedCount} movies archived.`, {
                description: errorCount > 0 ? `${errorCount} entries could not be reconciled automatically.` : "All archival data verified."
            });
        } catch (error) {
            console.error("Import failed:", error);
            toast.error("Migration failed. Check file formats.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-12 max-w-2xl mx-auto py-12">
            <div className="space-y-4">
                <h2 className="serif-title text-4xl text-white/90">Migration Protocol</h2>
                <p className="mono-detail uppercase tracking-[0.2em] text-white/30 text-[10px]">
                    Bridge your external cinema history into the archive.
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-white/40 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-mono text-white/60 uppercase tracking-widest leading-relaxed">
                            Instructions: Unzip your Letterboxd Export
                        </p>
                        <p className="text-[9px] text-white/30 font-mono leading-relaxed">
                            Letterboxd provides your data in a <span className="text-white/50">.zip</span> file.
                            Please extract/unzip the file on your computer and upload the individual <span className="text-white/50">.csv</span> files found inside the folders.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                <FileField
                    label="Diary"
                    description="diary.csv (Watches, Ratings, Reviews)"
                    file={files.diary}
                    onFileChange={(f) => handleFileChange('diary', f)}
                />
                <FileField
                    label="Watchlist"
                    description="watchlist.csv (To-Watch List)"
                    file={files.watchlist}
                    onFileChange={(f) => handleFileChange('watchlist', f)}
                />
                <FileField
                    label="Favorites"
                    description="likes/films.csv (Liked Movies)"
                    file={files.likes}
                    onFileChange={(f) => handleFileChange('likes', f)}
                />
                <FileField
                    label="Custom Lists"
                    description="lists/*.csv (Your exported lists)"
                    file={files.lists}
                    onFileChange={(f) => handleFileChange('lists', f)}
                    multiple
                />
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Format: Letterboxd Export (v2.0+)</p>
                    <p className="text-[9px] font-mono text-white/10 italic">Archival integrity will be verified during matching.</p>
                </div>
                <Button
                    onClick={startImport}
                    disabled={importing || (!files.diary && !files.watchlist && !files.likes && files.lists.length === 0)}
                    className="bg-white text-black hover:bg-white/90 rounded-none px-8 font-mono text-[10px] uppercase tracking-[0.2em] h-12"
                >
                    {importing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        "Initiate Migration"
                    )}
                </Button>
            </div>

            {importing && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="space-y-2">
                        <div className="flex justify-between font-mono text-[9px] text-white/40 uppercase tracking-widest">
                            <span>Reconciliation Status</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-[1px] bg-white/5" />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto scrollbar-hide border border-white/5 bg-black/40 backdrop-blur-sm p-4 space-y-2">
                        {results.slice(0, 100).map((res, i) => (
                            <div key={i} className="flex justify-between items-center py-1 border-b border-white/[0.02]">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-white/70 truncate max-w-[200px]">{res.row.Name}</span>
                                    <span className="text-[8px] font-mono text-white/20 uppercase">
                                        {res.row.Year} • {res.row._importType === 'list' ? res.row._listName : res.row._importType}
                                    </span>
                                </div>
                                <StatusIndicator status={res.status} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function FileField({ label, description, file, onFileChange, multiple }: {
    label: string;
    description: string;
    file: File | File[] | null;
    onFileChange: (f: File | File[] | null) => void;
    multiple?: boolean;
}) {
    const isArray = Array.isArray(file);
    const hasFiles = isArray ? file.length > 0 : !!file;

    return (
        <div className="group relative flex items-center justify-between p-6 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500">
            <div className="space-y-1">
                <label className="font-mono text-[10px] text-white/60 uppercase tracking-widest">{label}</label>
                <p className="text-[9px] text-white/20 font-mono italic">{description}</p>
            </div>

            <div className="relative">
                {hasFiles ? (
                    <div className="flex items-center gap-4 animate-in zoom-in-95 duration-500">
                        <span className="text-[10px] font-mono text-white/40 max-w-[150px] truncate">
                            {isArray ? `${file.length} lists selected` : (file as File).name}
                        </span>
                        <button
                            onClick={() => onFileChange(null)}
                            className="p-2 hover:bg-white/5 text-white/20 hover:text-white/60 transition-colors"
                        >
                            <X size={14} />
                        </button>
                        <FileCheck className="text-primary/60 h-5 w-5" />
                    </div>
                ) : (
                    <label className="flex items-center gap-2 cursor-pointer p-3 border border-dashed border-white/10 hover:border-white/30 text-white/20 hover:text-white/40 transition-all">
                        <Upload size={14} />
                        <span className="font-mono text-[10px] uppercase tracking-widest">Select {multiple ? 'Files' : 'File'}</span>
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            multiple={multiple}
                            className="hidden"
                            onChange={(e) => {
                                if (multiple) {
                                    onFileChange(Array.from(e.target.files || []));
                                } else {
                                    onFileChange(e.target.files?.[0] || null);
                                }
                            }}
                        />
                    </label>
                )}
            </div>
        </div>
    );
}

function StatusIndicator({ status }: { status: MatchResult['status'] }) {
    switch (status) {
        case 'pending': return <div className="h-1 w-1 rounded-full bg-white/20" />;
        case 'matching': return <Loader2 className="h-3 w-3 animate-spin text-white/40" />;
        case 'matched': return <CheckCircle2 className="h-3 w-3 text-primary/60" />;
        case 'unmatched': return <X className="h-3 w-3 text-destructive/60" />;
        case 'error': return <X className="h-3 w-3 text-destructive" />;
        default: return null;
    }
}
