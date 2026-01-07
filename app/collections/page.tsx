'use client'

import { useState, useEffect } from 'react'
import Header from '@/app/components/shared/Header'
import CollectionCard from '@/app/components/collections/CollectionCard'

interface Collection {
  id: string
  title: string
  description: string
  itemCount: number
  lastUpdated: string
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadCollections = async () => {
      try {
        // Mock collections - in production, fetch from API
        const mockCollections: Collection[] = [
          {
            id: '1',
            title: 'Web Development',
            description:
              'Comprehensive guide to modern web development with React, Next.js, and TypeScript.',
            itemCount: 45,
            lastUpdated: '2 days ago',
          },
          {
            id: '2',
            title: 'Mobile Development',
            description:
              'Learn mobile app development with React Native and Flutter.',
            itemCount: 32,
            lastUpdated: '5 days ago',
          },
          {
            id: '3',
            title: 'Cloud & DevOps',
            description:
              'Cloud computing, Docker, Kubernetes, and deployment strategies.',
            itemCount: 28,
            lastUpdated: '1 week ago',
          },
          {
            id: '4',
            title: 'Data Science',
            description:
              'Machine learning, Python, data analysis, and visualization.',
            itemCount: 38,
            lastUpdated: '3 days ago',
          },
          {
            id: '5',
            title: 'UI/UX Design',
            description:
              'Design principles, Figma, prototyping, and user experience best practices.',
            itemCount: 24,
            lastUpdated: '1 week ago',
          },
          {
            id: '6',
            title: 'Database Design',
            description:
              'SQL, NoSQL, database optimization, and data modeling.',
            itemCount: 31,
            lastUpdated: '4 days ago',
          },
        ]

        setCollections(mockCollections)
      } catch (error) {
        console.error('Failed to load collections:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCollections()
  }, [])

  const filteredCollections = collections.filter(
    (collection) =>
      collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Collections</h1>
          <p className="text-white/70 text-lg mb-8">
            Browse our curated collections of resources and content organized by
            topic.
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
            />
            <select className="px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm">
              <option className="bg-slate-900">All Categories</option>
              <option className="bg-slate-900">Development</option>
              <option className="bg-slate-900">Design</option>
              <option className="bg-slate-900">Data</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-white/70">
              No collections found matching "{searchTerm}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                {...collection}
                link={`/collections/${collection.id}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
