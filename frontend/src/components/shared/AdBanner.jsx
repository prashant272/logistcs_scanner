import React, { useState, useEffect } from 'react';
import { ArrowRight, Globe, X, Building2 } from 'lucide-react';
import api from '../../api/axios';

const AdBanner = ({ section = '', pageUrl = '', placement = 'top', className = '' }) => {
  const [ads, setAds] = useState([]);
  const [hiddenAds, setHiddenAds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchAds = async () => {
      try {
        const params = new URLSearchParams();
        if (section) params.append('section', section);
        if (pageUrl) params.append('pageUrl', pageUrl);

        const res = await api.get(`/ads/active?${params.toString()}`);
        if (isMounted && res.data && Array.isArray(res.data)) {
          setAds(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch ads:', err);
      }
    };

    fetchAds();
    return () => { isMounted = false; };
  }, [section, pageUrl]);

  const visibleAds = ads.filter(ad => {
    if (hiddenAds.includes(ad._id)) return false;
    if (placement === 'all') return true;
    if (placement === 'top') return ad.placement === 'top' || !ad.placement;
    if (placement === 'inline') return ad.placement === 'inline';
    if (placement === 'sidebar') return ad.placement === 'sidebar';
    return true;
  });

  const formatLink = (url) => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  if (visibleAds.length === 0) return null;

  // Sidebar Placement View (Vertical Column on the right)
  if (placement === 'sidebar') {
    return (
      <div className={`w-full lg:w-[280px] xl:w-[300px] shrink-0 space-y-4 sticky top-6 self-start pb-20 ${className}`}>
        <div className="flex items-center gap-2 mb-2 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_4px_12px_rgba(11,30,67,0.03)]">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center">
            <Building2 size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase">Sponsored Ads</h3>
        </div>

        <div className="space-y-4">
          {visibleAds.map((ad, idx) => (
            <div
              key={`sidebar-ad-${ad._id || idx}`}
              className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:border-blue-300 hover:shadow-md transition-all group relative"
            >
              <button
                onClick={() => setHiddenAds(prev => [...prev, ad._id])}
                className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/70 text-white p-1 rounded-full backdrop-blur-sm transition-all"
                title="Hide Ad"
              >
                <X size={12} />
              </button>

              {ad.imageUrl && (
                <div className="w-full h-[140px] bg-slate-100 relative overflow-hidden">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title || ad.headline}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-[#0066FF] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-sm">
                    AD
                  </div>
                </div>
              )}

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-1.5 mb-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <Globe size={11} className="text-[#0066FF]" />
                  <span>{ad.sponsorName || 'Partner'}</span>
                </div>
                <h4 className="text-[#0B1E43] font-black text-sm leading-snug">{ad.headline || ad.title || 'Sponsored Advertisement'}</h4>
                {ad.description && (
                  <p className="text-slate-500 text-[11px] font-medium mt-1.5 line-clamp-2 leading-relaxed">
                    {ad.description}
                  </p>
                )}

                {ad.features && ad.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {ad.features.slice(0, 3).map((feat, i) => (
                      <span key={i} className="text-[9px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                        {feat}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-50">
                  <a
                    href={formatLink(ad.linkUrl)}
                    target={ad.openInNewTab !== false && ad.linkUrl ? "_blank" : "_self"}
                    rel={ad.openInNewTab !== false ? "noopener noreferrer" : ""}
                    className="block w-full text-center bg-[#0066FF] hover:bg-[#0052cc] text-white font-black text-[11px] py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-md shadow-[#0066FF]/20"
                  >
                    {ad.buttonText || 'Learn More'} <ArrowRight size={12} className="inline ml-1 mb-0.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Top / Inline Placement View (Clean Modern Responsive Banner)
  return (
    <div className={`w-full space-y-4 ${className}`}>
      {visibleAds.map((ad, index) => (
        <div
          key={`ad-banner-${ad._id || index}`}
          className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgba(11,30,67,0.04)] relative overflow-hidden flex flex-col md:flex-row items-stretch justify-between transition-all hover:shadow-[0_8px_30px_rgba(0,102,255,0.08)] hover:border-blue-300 group min-h-[140px]"
        >
          {/* Subtle Close Button in top right */}
          <button
            onClick={() => setHiddenAds(prev => [...prev, ad._id])}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 bg-white/90 hover:bg-white p-1.5 rounded-full backdrop-blur-sm transition-all z-20 border border-slate-200/80 shadow-xs"
            title="Hide Ad"
          >
            <X size={14} />
          </button>

          {/* Left Section: Badges, Headline, Description, Features, CTA */}
          <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 lg:p-7 z-10 min-w-0">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="bg-[#0066FF] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  AD
                </span>
                <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2.5 py-0.5 rounded flex items-center gap-1.5">
                  <Globe size={11} className="text-[#0066FF]" />
                  <span>Sponsored by <strong className="text-slate-800">{ad.sponsorName || 'Verified Partner'}</strong></span>
                </span>
              </div>

              <h3 className="text-[#0B1E43] text-base sm:text-lg lg:text-xl font-black tracking-tight leading-snug line-clamp-2">
                {ad.headline || (ad.sponsorName ? `${ad.sponsorName} – Your Trusted Logistics Partner` : 'Your Trusted Logistics Partner')}
              </h3>

              {ad.description && (
                <p className="text-slate-500 text-xs sm:text-[13px] font-medium mt-1.5 leading-relaxed line-clamp-2 max-w-xl">
                  {ad.description}
                </p>
              )}

              {ad.features && ad.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {ad.features.slice(0, 4).map((feat, i) => (
                    <span key={i} className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-lg">
                      {feat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-1">
              <a
                href={formatLink(ad.linkUrl)}
                target={ad.openInNewTab !== false && ad.linkUrl ? "_blank" : "_self"}
                rel={ad.openInNewTab !== false ? "noopener noreferrer" : ""}
                className="inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-[13px] px-6 py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-md shadow-[#0066FF]/20 hover:shadow-lg hover:shadow-[#0066FF]/30 active:scale-95 whitespace-nowrap"
              >
                <span>{ad.buttonText || 'Learn More'}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Right Image Section */}
          {ad.imageUrl && (
            <div className="p-3 sm:p-4 md:p-5 flex items-center justify-center shrink-0 self-center w-full md:w-auto">
              <div className="w-full sm:w-[280px] md:w-[320px] lg:w-[350px] xl:w-[380px] h-[135px] sm:h-[145px] md:h-[155px] lg:h-[165px] rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 relative group bg-slate-50 flex items-center justify-center">
                <img
                  src={ad.imageUrl}
                  alt={ad.title || ad.headline || 'Ad Banner'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdBanner;
