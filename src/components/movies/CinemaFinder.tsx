import { useState, useEffect } from "react";
import { Map, MapMarker, MarkerPopup } from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Navigation, Film, Search } from "lucide-react";
import { searchCinemasByCity, searchCinemasNearLocation, type Cinema } from "@/lib/cinema-api";
import { cn } from "@/lib/utils";

interface CinemaFinderProps {
  onSelectCinema?: (cinema: Cinema) => void;
  selectedCinema?: Cinema | null;
  className?: string;
}

export function CinemaFinder({ onSelectCinema, selectedCinema, className }: CinemaFinderProps) {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.3165, 78.0322]); // Default: Dehradun
  const [mapZoom, setMapZoom] = useState(13);
  const [error, setError] = useState<string | null>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([longitude, latitude]); // [lng, lat] for MapLibre
          setMapZoom(13);
          loadCinemasNearLocation(latitude, longitude);
        },
        (err) => {
          console.error("Error getting location:", err);
          setError("Unable to get your location. Please search for a city.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, []);

  const loadCinemasNearLocation = async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchCinemasNearLocation(lat, lng, 10);
      setCinemas(results);
      if (results.length > 0) {
        setMapCenter([results[0].lng, results[0].lat]); // [lng, lat] for MapLibre
      }
    } catch (err) {
      setError("Failed to load cinemas. Please try searching by city name.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const results = await searchCinemasByCity(searchQuery.trim());
      setCinemas(results);
      if (results.length > 0) {
        setMapCenter([results[0].lng, results[0].lat]); // [lng, lat] for MapLibre
        setMapZoom(13);
      } else {
        setError("No cinemas found. Try a different city name.");
      }
    } catch (err) {
      setError("Failed to search cinemas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setMapZoom(13);
      loadCinemasNearLocation(userLocation[0], userLocation[1]);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
            setMapCenter([longitude, latitude]); // [lng, lat] for MapLibre
            loadCinemasNearLocation(latitude, longitude);
          },
          () => setError("Unable to get your location.")
        );
      }
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Search Bar */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Film className="h-5 w-5" />
            Find Cinemas
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            Search by city or use your current location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by city (e.g., Dehradun, New York)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 font-mono text-sm"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
            <Button variant="outline" onClick={handleUseMyLocation} disabled={loading}>
              <Navigation className="h-4 w-4 mr-2" />
              My Location
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive font-mono text-xs">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[500px] w-full relative">
            <Map center={mapCenter} zoom={mapZoom}>
              {cinemas.map((cinema) => (
                <MapMarker key={cinema.id} longitude={cinema.lng} latitude={cinema.lat}>
                  <MarkerPopup>
                    <div className="space-y-2 p-3 min-w-[200px]">
                      <div>
                        <h3 className="font-serif font-bold text-sm mb-1">{cinema.name}</h3>
                        <p className="font-mono text-xs text-muted-foreground flex items-start gap-1">
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{cinema.displayName}</span>
                        </p>
                      </div>
                      {onSelectCinema && (
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs"
                          onClick={() => onSelectCinema(cinema)}
                          variant={selectedCinema?.id === cinema.id ? "default" : "outline"}
                        >
                          {selectedCinema?.id === cinema.id ? "Selected" : "Select"}
                        </Button>
                      )}
                    </div>
                  </MarkerPopup>
                </MapMarker>
              ))}
            </Map>
            {loading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cinema List */}
      {cinemas.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg">
              Found {cinemas.length} Cinema{cinemas.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {cinemas.map((cinema) => (
                <div
                  key={cinema.id}
                  className={cn(
                    "p-3 border border-border/30 rounded-lg cursor-pointer transition-all hover:border-primary/50",
                    selectedCinema?.id === cinema.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => onSelectCinema?.(cinema)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-medium text-sm mb-1">{cinema.name}</h4>
                      <p className="font-mono text-xs text-muted-foreground line-clamp-2">
                        {cinema.displayName}
                      </p>
                    </div>
                    {selectedCinema?.id === cinema.id && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
