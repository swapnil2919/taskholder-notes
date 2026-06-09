export default function Spinner({ size = 18 }) {
  return (
    <span
      className="inline-block rounded-full border-2 border-white/10 border-t-violet-400 border-r-cyan-400 animate-spin shrink-0"
      style={{ width: size, height: size }}
    />
  )
}
