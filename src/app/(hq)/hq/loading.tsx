export default function HqLoading() {
  return <div className="space-y-8" aria-label="Cargando Crealy HQ" aria-busy="true">
    <div className="hq-skeleton h-24 w-full" />
    <div className="grid grid-cols-2 gap-px border-y border-white/8 lg:grid-cols-4">
      {[0, 1, 2, 3].map((item) => <div key={item} className="hq-skeleton h-40" />)}
    </div>
    <div className="hq-skeleton h-80 w-full" />
  </div>;
}
