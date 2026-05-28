import L from 'leaflet';

// Custom Leaflet icons utilizing Tailwind classes inside divIcon to match dark mining dashboard aesthetic
export const getTruckMarker = (status: string, isAssigned: boolean = true) => {
  let colorClass = 'bg-orange-500 text-black';
  let pulseClass = 'bg-orange-500/30';

  if (status === 'Maintenance') {
    colorClass = 'bg-yellow-500 text-black';
    pulseClass = 'bg-yellow-500/20';
  } else if (status === 'Out of Service') {
    colorClass = 'bg-red-500 text-white';
    pulseClass = 'bg-red-500/10';
  } else if (status === 'Idle') {
    colorClass = 'bg-zinc-600 text-zinc-200';
    pulseClass = 'bg-zinc-500/20';
  }

  return L.divIcon({
    className: 'custom-fleet-truck-marker',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer">
        ${status === 'Active' || status === 'On Route' ? `
          <span class="absolute inline-flex h-9 w-9 animate-ping rounded-full ${pulseClass} opacity-75"></span>
        ` : ''}
        <div class="relative h-7 w-7 rounded-full ${colorClass} border-2 border-slate-950 flex items-center justify-center text-xs shadow-xl font-bold transition-transform hover:scale-115">
          🚛
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -10]
  });
};

export const getHubMarker = (type: 'source' | 'destination' | 'general', label: string = '') => {
  const iconEmoji = type === 'source' ? '⛏️' : type === 'destination' ? '🏭' : '🏢';
  const borderClass = type === 'source' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-zinc-500';

  return L.divIcon({
    className: 'custom-fleet-hub-marker',
    html: `
      <div class="relative flex flex-col items-center justify-center cursor-pointer">
        <div class="relative h-8 w-8 rounded-lg bg-slate-900 border ${borderClass} flex items-center justify-center text-sm shadow-2xl">
          ${iconEmoji}
        </div>
        ${label ? `
          <div class="absolute -bottom-6 bg-slate-950/90 text-[10px] text-zinc-300 px-1 rounded border border-zinc-800 whitespace-nowrap pointer-events-none scale-90">
            ${label}
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -15]
  });
};
