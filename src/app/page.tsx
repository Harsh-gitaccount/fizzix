import Link from 'next/link'
import { getAllModules } from '@/simulations/registry'

export default function Home() {
  const modules = getAllModules()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <header className="py-8 px-4 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Fizzix 6-12
        </h1>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
          Free physics simulations for Indian students
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <Link
              key={mod.slug}
              href={`/${mod.slug}`}
              className="group block rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <div className="text-3xl mb-3">{mod.icon}</div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {mod.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {mod.description}
              </p>
              <span
                className="mt-3 inline-block px-2 py-0.5 text-[10px] font-bold rounded-full text-white"
                style={{ backgroundColor: mod.color }}
              >
                Class {mod.classRange}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
