export const formatUptime = (seconds) => {
  if (!seconds || seconds === 0) return '00:00:00';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${m}m`;
};