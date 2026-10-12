import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { api, unwrap } from '../../shared/api';
import { CATEGORY } from '../../shared/categories';
import { MapView, type Bbox } from '../components/MapView';
import { PlaceCard } from '../components/PlaceCard';
import { useGeo, DEFAULT_CENTER } from '../geo';

/** Every place in the visible area (bbox), as category-shaped markers. */
export function MapPage() {
  const geo = useGeo();
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const center = geo.coords ?? DEFAULT_CENTER;

  const places = useQuery({
    queryKey: ['places', 'map', bbox],
    enabled: !!bbox,
    placeholderData: keepPreviousData,
    queryFn: () =>
      unwrap(
        api.GET('/places', {
          params: {
            query: {
              bbox: `${bbox!.minLng.toFixed(5)},${bbox!.minLat.toFixed(5)},${bbox!.maxLng.toFixed(5)},${bbox!.maxLat.toFixed(5)}`,
              limit: 500,
              lat: geo.coords?.lat,
              lng: geo.coords?.lng,
            },
          },
        }),
      ),
  });
  const items = places.data?.items ?? [];
  const markers = useMemo(
    () =>
      items.map((p) => ({
        id: p.id,
        lat: p.location.lat,
        lng: p.location.lng,
        category: p.category_id,
        label: `${p.name}, ${CATEGORY[p.category_id].label}`,
      })),
    [items],
  );
  const current = items.find((p) => p.id === selected);

  return (
    <div className="map-page">
      <MapView
        center={center}
        zoom={13}
        markers={markers}
        selectedId={selected}
        onMarkerClick={setSelected}
        onMapClick={() => setSelected(null)}
        onMove={(b) => setBbox(b)}
        className="map-full"
      />
      <div className="map-overlay">
        <span className="label map-count">{places.data ? `${places.data.total} w widoku` : ' '}</span>
        <button type="button" className="btn btn-secondary btn-small map-locate" onClick={geo.request}>
          {geo.status === 'pending' ? 'Szukam…' : 'Moja lokalizacja'}
        </button>
      </div>
      {current && (
        <div className="map-card">
          <PlaceCard place={current} compact />
        </div>
      )}
    </div>
  );
}
