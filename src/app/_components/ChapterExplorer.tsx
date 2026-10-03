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

const INVESTIGATION_QUESTIONS: Record<string, string> = {
  'projectile-motion': 'What angle gives the longest throw?',
  'shm': 'Does a heavier pendulum swing slower?',
  'electrostatics': 'What happens when two like charges get closer?',
  'optics': 'When does light bend away from the normal?',
  'thermodynamics': 'Why do lighter molecules move faster?',
  'modern-physics': 'Can red light eject electrons from caesium?',
}

export function ChapterExplorer({ topics }: { topics: Topic[] }) {
  const [active, setActive] = useState(0)
  const current = topics[active]
  const Illustration = current ? TOPIC_ILLUSTRATIONS[current.slug] : null

  return (
    <section id="chapters" className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 sm:mb-10">
          <p className="text-xs font-mono text-fb-dim tracking-widest uppercase mb-3">The Fieldbook</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-fb-ink tracking-tight mb-2 font-serif">
            Six chapters of experiments
          </h2>
          <p className="text-sm text-fb-muted max-w-md leading-relaxed">
            Each topic has interactive experiments, guided presets, and quiz questions.
          </p>
        </div>

        {/* Chapter tabs */}
        <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Topic chapters">
          {topics.map((topic, i) => (
            <button
              key={topic.slug}
              role="tab"
              aria-selected={active === i}
              aria-controls="chapter-panel"
              onClick={() => setActive(i)}
              className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                active === i
                  ? 'text-white'
                  : 'text-fb-muted bg-fb-paper hover:text-fb-ink border border-fb-rule/60'
              }`}
              style={active === i ? { backgroundColor: topic.color } : undefined}
            >
              {topic.name}
            </button>
          ))}
        </div>

        {/* Active chapter panel */}
        {current && (
          <div
            id="chapter-panel"
            role="tabpanel"
            className="rounded-xl border border-fb-rule overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Illustration */}
              {Illustration && (
                <div className="sm:w-2/5 aspect-[4/3] sm:aspect-auto bg-fb-field relative flex-shrink-0">
                  <div className="absolute inset-0">
                    <Illustration color={current.color} />
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[10px] font-mono text-white/40">
                      Ch.{String(active + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="flex-1 p-5 sm:p-6 bg-fb-page flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-fb-ink font-serif">
                      {current.name}
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-fb-paper text-fb-dim border border-fb-rule/60">
                      Class {current.classRange}
                    </span>
                  </div>
                  <p className="text-sm text-fb-muted leading-relaxed mb-3">
                    {current.description}
                  </p>
                  <p className="text-sm font-medium text-fb-ink italic">
                    &ldquo;{INVESTIGATION_QUESTIONS[current.slug]}&rdquo;
                  </p>
                </div>
                <div className="mt-5">
                  <Link
                    href={`/${current.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors group"
                    style={{ backgroundColor: current.color }}
                  >
                    Open {current.name}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                      <path d="M5 3l4 4-4 4" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact chapter grid — all chapters accessible */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {topics.map((topic, i) => (
            <Link
              key={topic.slug}
              href={`/${topic.slug}`}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-lg border border-fb-rule/60 hover:border-fb-accent/30 transition-all hover:shadow-sm bg-fb-page"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: topic.color }}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-fb-muted group-hover:text-fb-ink transition-colors truncate">
                {topic.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
