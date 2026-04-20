import { Wrench, TrendingUp } from 'lucide-react';

export default function EquipmentPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
        <p className="text-gray-500 mt-1">Inventar und Investitionsplanung</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard
          title="Equipmentliste"
          description="Inventar verwalten"
          icon={<Wrench className="h-6 w-6" />}
        />
        <SectionCard
          title="Investitionspotential"
          description="Geplante Anschaffungen"
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>
    </div>
  );
}

function SectionCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="text-blue-600 mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}
