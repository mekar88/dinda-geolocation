import { useState, useEffect } from 'react';
import { MapPin, Navigation, Map as MapIcon, AlertCircle, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet with Vite
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function App() {
  const [location, setLocation] = useState<{ lat: number; lng: number, accuracy?: number, altitude?: number | null } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const getLocation = () => {
    setLoading(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('Geolokasi tidak didukung oleh browser Anda.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const altitude = position.coords.altitude;
        
        setLocation({ lat, lng, accuracy, altitude });
        setLastUpdated(new Date().toLocaleTimeString('id-ID'));
        
        try {
          // OpenStreetMap Nominatim API for reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: {
              'Accept-Language': 'id-ID,id;q=0.9'
            }
          });
          
          if (!response.ok) {
            throw new Error('Gagal mengambil data alamat');
          }
          
          const data = await response.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress('Alamat tidak ditemukan untuk koordinat ini.');
          }
        } catch (err) {
          setError('Terjadi kesalahan saat mengambil alamat. Pastikan Anda memiliki koneksi internet.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Izin akses lokasi ditolak. Silakan izinkan akses lokasi di browser untuk menggunakan fitur ini.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Informasi lokasi tidak tersedia.');
            break;
          case err.TIMEOUT:
            setError('Waktu permintaan akses lokasi habis. Silakan coba lagi.');
            break;
          default:
            setError('Terjadi kesalahan yang tidak diketahui saat mendeteksi lokasi.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const copyCoordinates = () => {
    if (location) {
      navigator.clipboard.writeText(`${location.lat}, ${location.lng}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col font-sans text-slate-900 relative overflow-hidden bg-slate-100">
      
      {/* Full-bleed Map Layer */}
      <div className="absolute inset-0 z-0">
        {location ? (
          <MapContainer 
            center={[location.lat, location.lng]} 
            zoom={16} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat, location.lng]}>
              <Popup>
                Lokasi Anda saat ini
              </Popup>
            </Marker>
            {location.accuracy && (
              <Circle 
                center={[location.lat, location.lng]} 
                radius={location.accuracy} 
                pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.2 }} 
              />
            )}
            <MapUpdater center={[location.lat, location.lng]} zoom={16} />
          </MapContainer>
        ) : (
          <div className="w-full h-full bg-[#e5e7eb] relative overflow-hidden flex items-center justify-center group pointer-events-none">
            <div className="absolute inset-0 bg-[#e5e7eb] transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="z-10 flex flex-col items-center gap-4 text-slate-400">
              <MapIcon size={64} className="opacity-50" />
              <span className="text-sm font-semibold uppercase tracking-widest">Peta belum tersedia</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating UI Overlay Base */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        
        {/* Header - Floating Top */}
        <header className="pointer-events-auto mx-4 mt-4 md:mx-8 md:mt-8 h-16 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl px-4 md:px-6 flex shrink-0 items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">GeoLocator ID</span>
          </div>
          <nav className="hidden sm:flex gap-6 text-sm font-bold text-slate-500">
            <a href="#" className="text-blue-600">Dashboard</a>
            <a href="#" className="hover:text-slate-800 transition-colors">History</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Settings</a>
          </nav>
        </header>

        {/* Content Area - Floating Over Map */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:px-8 pb-4 md:pb-8 flex flex-col justify-end gap-6 overflow-hidden">
          
          {/* Bottom Panel: Cards */}
          <div className="w-full pointer-events-none mt-auto">
             
             <div className="flex flex-col md:flex-row gap-3 pointer-events-auto overflow-y-auto max-h-[60vh] md:max-h-[35vh] scrollbar-hide pt-2">
                
                {error && (
                  <div className="p-4 bg-red-50/80 backdrop-blur-md text-red-700 rounded-2xl flex gap-3 text-sm border border-red-200/50 leading-relaxed shadow-[0_4px_24px_rgba(0,0,0,0.08)] shrink-0">
                    <AlertCircle size={18} className="shrink-0 text-red-500" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Location Card */}
                <div className="flex-1 bg-white/30 backdrop-blur-md p-4 md:p-5 rounded-3xl border border-white/40 shadow-[0_4px_32px_rgba(0,0,0,0.1)] shrink-0 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : location ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lokasi Saat Ini</span>
                  </div>
                  
                  {loading ? (
                    <div className="mb-3 space-y-2 flex-1">
                      <div className="h-6 bg-white/50 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-white/50 rounded w-1/2 animate-pulse mt-1"></div>
                    </div>
                  ) : location ? (
                    <div className="mb-3 flex-1">
                      <h2 className="text-lg md:text-xl font-extrabold leading-tight mb-1 text-slate-800 line-clamp-2">
                        {address ? address.split(',')[0] : 'Lokasi Terdeteksi'}
                      </h2>
                      <p className="text-slate-700 text-xs leading-relaxed line-clamp-3 font-medium">
                        {address || 'Menunggu detail alamat dari satelit...'}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-3 flex-1">
                      <h2 className="text-lg md:text-xl font-extrabold leading-tight mb-1 text-slate-600">
                        Tidak Ada Data
                      </h2>
                      <p className="text-slate-600 text-xs leading-relaxed font-medium">
                        Klik tombol bawah untuk memindai lokasi Anda.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-3 mt-auto border-t border-slate-400/20">
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold mb-0.5">Lintang (Latitude)</div>
                      <div className="font-mono text-sm font-bold tracking-tighter text-slate-900">
                        {location ? location.lat.toFixed(6) : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold mb-0.5">Bujur (Longitude)</div>
                      <div className="font-mono text-sm font-bold tracking-tighter text-slate-900">
                        {location ? location.lng.toFixed(6) : '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="flex-1 bg-white/30 backdrop-blur-md p-4 md:p-5 rounded-3xl border border-white/40 shadow-[0_4px_32px_rgba(0,0,0,0.1)] flex flex-col shrink-0">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-600 uppercase font-bold">Akurasi Geo</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        {location?.accuracy ? `${location.accuracy.toFixed(1)} m` : '- m'}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-600 uppercase font-bold">Ketinggian</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        {location?.altitude ? `${location.altitude.toFixed(0)} mdpl` : '- mdpl'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full h-2 bg-slate-400/20 rounded-full overflow-hidden shadow-inner">
                    {location && location.accuracy ? (
                      <div className={`h-full rounded-full transition-all duration-1000 ${location.accuracy < 20 ? 'bg-green-500 w-[95%]' : location.accuracy < 100 ? 'bg-blue-500 w-[70%]' : 'bg-amber-500 w-[40%]'}`}></div>
                    ) : (
                      <div className="h-full bg-slate-400/20 w-0"></div>
                    )}
                  </div>

                  <div className="space-y-2 mt-auto pt-3">
                    {!location && !loading && (
                      <button
                        onClick={getLocation}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs tracking-wide hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                      >
                        <Navigation size={16} />
                        Mulai Pindai Lokasi
                      </button>
                    )}
                    
                    {(location || loading) && (
                      <>
                        <button
                          onClick={getLocation}
                          disabled={loading}
                          className="w-full py-2.5 bg-slate-900/90 text-white rounded-xl font-bold text-xs tracking-wide hover:bg-slate-800 disabled:bg-slate-800 disabled:cursor-wait transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                        >
                          {loading ? (
                            <>
                              <Loader2 size={16} className="animate-spin text-slate-400" />
                              <span className="text-slate-300">Menarik Data Satelit...</span>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Refresh Koordinat
                            </>
                          )}
                        </button>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={copyCoordinates}
                            disabled={!location}
                            className="flex-1 py-2 bg-white/60 border border-white/50 text-slate-900 rounded-xl font-bold text-xs tracking-wide hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            {copied ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} className="text-slate-700" />}
                            Salin
                          </button>
                          
                          <a
                            href={location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : '#'}
                            target={location ? "_blank" : "_self"}
                            rel="noreferrer"
                            className={`flex-1 py-2 bg-white/60 border border-white/50 text-slate-900 rounded-xl font-bold text-xs tracking-wide hover:bg-white transition-colors flex items-center justify-center gap-1.5 shadow-sm ${!location ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <MapIcon size={14} className="text-blue-600" />
                            Maps
                          </a>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="px-1 pt-3 border-t border-slate-400/20 flex justify-between items-center text-[10px] font-bold text-slate-600">
                    <span>{lastUpdated ? `Update: ${lastUpdated}` : 'Menunggu update pertama'}</span>
                    <span>GPS: {location?.accuracy && location.accuracy < 20 ? 'High' : 'Standard'}</span>
                  </div>
                </div>

             </div>
          </div>
        </main>
      </div>
    </div>
  );
}

