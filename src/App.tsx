import { useState, useEffect } from 'react';
import { MapPin, Navigation, Map, AlertCircle, Loader2, Copy, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header Area */}
      <header className="w-full h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between z-10 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight">GeoLocator ID</span>
        </div>
        <nav className="hidden sm:flex gap-6 text-sm font-medium text-slate-500">
          <a href="#" className="text-blue-600">Dashboard</a>
          <a href="#" className="hover:text-slate-800 transition-colors">History</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Settings</a>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 overflow-hidden max-w-[1400px] mx-auto w-full">
        
        {/* Left Panel: Map & Visuals */}
        <div className="md:col-span-7 h-full flex flex-col gap-6 min-h-[300px] md:min-h-0">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#e5e7eb] transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-64 h-64 bg-blue-500/10 rounded-full border border-blue-500/30 flex items-center justify-center">
                  <div className="w-32 h-32 bg-blue-500/20 rounded-full border border-blue-500/40 flex items-center justify-center relative">
                     {loading ? (
                        <>
                          <div className="absolute inset-0 border border-blue-400 rounded-full animate-ping opacity-50"></div>
                          <div className="w-4 h-4 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.8)]"></div>
                        </>
                     ) : location ? (
                       <div className="w-4 h-4 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.8)]"></div>
                     ) : (
                       <div className="w-4 h-4 rounded-full bg-slate-300"></div>
                     )}
                  </div>
               </div>
            </div>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 text-[10px] uppercase tracking-widest font-bold text-slate-500">
              {loading ? 'Scanning Area...' : location ? 'Satellite View Active' : 'Waiting for Signal'}
            </div>
          </div>
        </div>

        {/* Right Panel: Data Display */}
        <div className="md:col-span-5 h-full flex flex-col gap-6">
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex gap-3 text-sm border border-red-100 leading-relaxed shadow-sm">
              <AlertCircle size={20} className="shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          {/* Location Card */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : location ? 'bg-green-500' : 'bg-slate-300'}`}></span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lokasi Saat Ini</span>
            </div>
            
            {loading ? (
              <div className="mb-6 space-y-3">
                <div className="h-8 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse mt-2"></div>
              </div>
            ) : location ? (
              <div className="mb-6">
                <h2 className="text-2xl font-bold leading-tight mb-2">
                  {address ? address.split(',')[0] : 'Lokasi Terdeteksi'}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {address || 'Menunggu detail alamat dari satelit...'}
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <h2 className="text-2xl font-bold leading-tight mb-2 text-slate-300">
                  Tidak Ada Data
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Klik tombol bawah untuk memindai lokasi Anda.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Lintang (Latitude)</div>
                <div className="font-mono text-lg font-medium tracking-tighter">
                  {location ? location.lat.toFixed(6) : '-'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Bujur (Longitude)</div>
                <div className="font-mono text-lg font-medium tracking-tighter">
                  {location ? location.lng.toFixed(6) : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 flex flex-col">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Akurasi Geo</span>
                <span className="text-xl font-bold">
                  {location?.accuracy ? `${location.accuracy.toFixed(1)} m` : '- m'}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Ketinggian</span>
                <span className="text-xl font-bold">
                  {location?.altitude ? `${location.altitude.toFixed(0)} mdpl` : '- mdpl'}
                </span>
              </div>
            </div>
            
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              {location && location.accuracy ? (
                <div className={`h-full rounded-full transition-all duration-1000 ${location.accuracy < 20 ? 'bg-green-500 w-[95%]' : location.accuracy < 100 ? 'bg-blue-600 w-[70%]' : 'bg-amber-500 w-[40%]'}`}></div>
              ) : (
                <div className="h-full bg-slate-200 w-0"></div>
              )}
            </div>

            <div className="space-y-3 mt-auto pt-6">
              {!location && !loading && (
                 <button
                  onClick={getLocation}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation size={18} />
                  Mulai Pindai Lokasi
                </button>
              )}
              
              {(location || loading) && (
                <>
                  <button
                    onClick={getLocation}
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-slate-800 disabled:bg-slate-800 disabled:cursor-wait transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin text-slate-400" />
                        <span className="text-slate-300">Menarik Data Satelit...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Koordinat
                      </>
                    )}
                  </button>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={copyCoordinates}
                      disabled={!location}
                      className="flex-1 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-sm tracking-wide hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} className="text-slate-500" />}
                      Salin
                    </button>
                    
                    <a
                      href={location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : '#'}
                      target={location ? "_blank" : "_self"}
                      rel="noreferrer"
                      className={`flex-1 py-3 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-sm tracking-wide hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 ${!location ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Map size={16} className="text-blue-500" />
                      Maps
                    </a>
                  </div>
                </>
              )}
            </div>

            <div className="px-1 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-medium text-slate-400">
              <span>{lastUpdated ? `Update Terakhir: ${lastUpdated}` : 'Menunggu update pertama'}</span>
              <span>GPS Provider: {location?.accuracy && location.accuracy < 20 ? 'High Precision' : 'Standard'}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

