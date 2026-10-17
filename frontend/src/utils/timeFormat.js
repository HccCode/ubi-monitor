// frontend/src/utils/timeFormat.js
export function formatUptime(totalSeconds) {
  if (!totalSeconds) return "0s";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  let result = [];
  if (days > 0) result.push(`${days}d`);
  if (hours > 0) result.push(`${hours}h`);
  if (minutes > 0) result.push(`${minutes}m`);
  
  if (result.length === 0) return `${totalSeconds}s`;
  
  return result.join(' ');
}