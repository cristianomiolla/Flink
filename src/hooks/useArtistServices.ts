import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { ArtistService, CreateServiceData } from '../types/portfolio'

export function useArtistServices(userId?: string) {
  const [services, setServices] = useState<ArtistService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    if (!userId) {
      setServices([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('artist_services')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setServices(data || [])
      setError(null)
    } catch (err) {
      setError('Errore nel caricamento dei servizi')
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const createService = useCallback(async (serviceData: CreateServiceData): Promise<boolean> => {
    if (!userId) {
      setError('Devi essere autenticato per creare un servizio')
      return false
    }

    try {
      // Prepare data according to new schema and constraints
      const insertData: {
        name: string
        description: string | null
        body_area: string | null
        size_category: string | null
        pricing_type: 'fixed' | 'range'
        fixed_price: number | null
        price_min: number | null
        price_max: number | null
        discount_percentage: number
        image_url: string | null
        user_id: string
      } = {
        name: serviceData.name,
        description: serviceData.description || null,
        body_area: serviceData.body_area || null,
        size_category: serviceData.size_category || null,
        pricing_type: serviceData.pricing_type,
        fixed_price: null,
        price_min: null,
        price_max: null,
        discount_percentage: serviceData.discount_percentage || 0,
        image_url: serviceData.image_url || null,
        user_id: userId
      }

      // Set price fields based on pricing type to satisfy constraints
      if (serviceData.pricing_type === 'fixed') {
        insertData.fixed_price = serviceData.fixed_price
        // Ensure range prices are null for fixed pricing
        insertData.price_min = null
        insertData.price_max = null
      } else if (serviceData.pricing_type === 'range') {
        insertData.price_min = serviceData.price_min
        insertData.price_max = serviceData.price_max
        // Ensure fixed price is null for range pricing
        insertData.fixed_price = null
      }


      const { data, error } = await supabase
        .from('artist_services')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error

      setServices(prev => [data, ...prev])
      setError(null)
      return true
    } catch (err) {
      setError('Errore nella creazione del servizio')
      return false
    }
  }, [userId])

  const updateService = useCallback(async (serviceId: string, updates: Partial<CreateServiceData>): Promise<boolean> => {
    try {
      // Prepare updates according to new schema
      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description || null
      if (updates.body_area !== undefined) updateData.body_area = updates.body_area || null
      if (updates.size_category !== undefined) updateData.size_category = updates.size_category || null
      if (updates.pricing_type !== undefined) {
        updateData.pricing_type = updates.pricing_type
        // Reset price fields based on pricing type to satisfy constraints
        if (updates.pricing_type === 'fixed') {
          updateData.fixed_price = updates.fixed_price || null
          updateData.price_min = null
          updateData.price_max = null
        } else if (updates.pricing_type === 'range') {
          updateData.fixed_price = null
          updateData.price_min = updates.price_min || null
          updateData.price_max = updates.price_max || null
        }
      } else {
        // Update individual price fields only if pricing_type is not changing
        if (updates.fixed_price !== undefined) updateData.fixed_price = updates.fixed_price
        if (updates.price_min !== undefined) updateData.price_min = updates.price_min
        if (updates.price_max !== undefined) updateData.price_max = updates.price_max
      }
      if (updates.discount_percentage !== undefined) updateData.discount_percentage = updates.discount_percentage || 0
      if (updates.image_url !== undefined) updateData.image_url = updates.image_url || null


      const { data, error } = await supabase
        .from('artist_services')
        .update(updateData)
        .eq('id', serviceId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      setServices(prev => prev.map(service => 
        service.id === serviceId ? { ...service, ...data } : service
      ))
      setError(null)
      return true
    } catch (err) {
      setError('Errore nell\'aggiornamento del servizio')
      return false
    }
  }, [userId])

  const deleteService = useCallback(async (serviceId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('artist_services')
        .delete()
        .eq('id', serviceId)
        .eq('user_id', userId)

      if (error) throw error

      setServices(prev => prev.filter(service => service.id !== serviceId))
      setError(null)
      return true
    } catch (err) {
      setError('Errore nella cancellazione del servizio')
      return false
    }
  }, [userId])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    refetchServices: fetchServices,
    clearError
  }
}