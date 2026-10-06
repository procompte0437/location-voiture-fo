import { useEffect, useState } from 'react'
import { PublicHeader } from '../components/layout/Header'
import { ContentLoader } from '../components/ui/Spinner'
import api from '../lib/api'

export function FaqPage() {
  const [items, setItems] = useState<{ id: number; question: string; answer: string }[]>([])

  useEffect(() => {
    void api.get('/catalog/faq').then(({ data }) => setItems(data.data || []))
  }, [])

  return (
    <div className="min-h-screen bg-sand-50">
      <PublicHeader />
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-3xl font-bold text-forest-950">FAQ</h1>
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-sand-200 bg-white p-5">
              <h2 className="font-semibold text-ink-900">{item.question}</h2>
              <p className="mt-2 text-ink-700">{item.answer}</p>
            </div>
          ))}
          {items.length === 0 && <ContentLoader />}
        </div>
      </div>
    </div>
  )
}
