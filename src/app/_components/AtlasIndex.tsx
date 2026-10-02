'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TOPIC_ILLUSTRATIONS } from './TopicIllustrations'

interface Topic {
  slug: string
  name: string
  description: string
  classRange: string
  color: string
}

function TopicNumber({ n }: { n: number }) {
  return (
    <span className="text-[11px] font-mono text-slate-600 w-5 shrink-0 tabular-nums">
      {String(n).padStart(2, '0')}
    </span>
  )
}

function DesktopIndex({ topics }: { topics: Topic[] }) {
  const [selected, setSelected] = useState(0)
  const topic = topics[selected]
  const Illustration = TOPIC_ILLUSTRATIONS[topic.slug]

  return (
    <div className="hidden md:grid grid-cols-[2fr_3fr] gap-8 items-start">
      {/* list */}
      <div className="space-y-1">
        {topics.map((t, i) => (
          <button
            key={t.slug}
            onClick={() => setSelected(i)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              i === selected
                ? 'bg-white/[0.04] text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
            }`}
            aria-pressed={i === selected}
          >
            <TopicNumber n={i + 1} />
            <span className="text-sm">{t.name}</span>
          </button>
        ))}
      </div>

      {/* preview */}
      <div className="rounded-xl border border-white/[0.06] bg-atlas-surface/40 overflow-hidden">
        {Illustration && (
          <div className="aspect-[3/2] border-b border-white/[0.06]">
            <Illustration color={topic.color} />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">{topic.name}</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
              Class {topic.classRange}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">{topic.description}</p>
          <Link
            href={`/${topic.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-colors hover:bg-white/[0.04]"
            style={{ color: topic.color, borderColor: `${topic.color}33` }}
          >
            Open lesson
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 3l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

function MobileIndex({ topics }: { topics: Topic[] }) {
  const [selected, setSelected] = useState(0)
  const topic = topics[selected]
  const Illustration = TOPIC_ILLUSTRATIONS[topic.slug]

  return (
    <div className="md:hidden">
      {/* pill selector */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide" role="tablist">
        {topics.map((t, i) => (
          <button
            key={t.slug}
            onClick={() => setSelected(i)}
            role="tab"
            aria-selected={i === selected}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
              i === selected
                ? 'bg-white/[0.08] border-white/[0.12] text-white'
                : 'border-white/[0.06] text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* preview card */}
      <div className="rounded-xl border border-white/[0.06] bg-atlas-surface/40 overflow-hidden mt-2">
        {Illustration && (
          <div className="aspect-[2/1] border-b border-white/[0.06]">
            <Illustration color={topic.color} />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-base font-semibold text-white">{topic.name}</h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
              {topic.classRange}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-3 leading-relaxed">{topic.description}</p>
          <Link
            href={`/${topic.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-lg border transition-colors"
            style={{ color: topic.color, borderColor: `${topic.color}33` }}
          >
            Open lesson
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 3l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

export function AtlasIndex({ topics }: { topics: Topic[] }) {
  return (
    <>
      <DesktopIndex topics={topics} />
      <MobileIndex topics={topics} />
    </>
  )
}
