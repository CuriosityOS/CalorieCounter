'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { WeightEntry } from '@/lib/supabase-client';
import { useAuth } from './useAuth';

export function useWeightHistory() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWeightHistory = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      console.log('Fetching weight history for user:', user.id);
      
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error in Supabase weight entries query:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Retrieved ${data.length} weight entries from Supabase`);
        setEntries(data as WeightEntry[]);
      } else {
        console.log('No weight entries found for user');
        setEntries([]);
      }
    } catch (err) {
      console.error('Error fetching weight history:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWeightHistory();
  }, [fetchWeightHistory]);

  const addWeightEntry = useCallback(async (weight: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const entry = {
        user_id: user.id,
        weight,
      };
      
      const { data, error } = await supabase
        .from('weight_entries')
        .insert([entry])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      await fetchWeightHistory(); // Refresh entries after adding
      return data as WeightEntry;
    } catch (err) {
      console.error('Error adding weight entry:', err);
      throw err;
    }
  }, [user, fetchWeightHistory]);

  const deleteWeightEntry = useCallback(async (entryId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      const { error } = await supabase
        .from('weight_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id); // Ensure the entry belongs to this user
        
      if (error) {
        throw error;
      }
      
      await fetchWeightHistory(); // Refresh entries after deleting
    } catch (err) {
      console.error('Error deleting weight entry:', err);
      throw err;
    }
  }, [user, fetchWeightHistory]);

  // Parse entries for charting - get most recent entry for each day to avoid duplicates
  const chartData = entries.reduce((acc, entry) => {
    const date = new Date(entry.created_at).toISOString().split('T')[0];
    
    // Only keep the most recent entry for each day
    if (!acc[date] || new Date(entry.created_at) > new Date(acc[date].created_at)) {
      acc[date] = entry;
    }
    
    return acc;
  }, {} as Record<string, WeightEntry>);

  const formattedChartData = Object.values(chartData).map(entry => ({
    date: new Date(entry.created_at).toISOString().split('T')[0],
    weight: entry.weight,
  }));

  return {
    entries,
    chartData: formattedChartData,
    loading,
    error,
    addWeightEntry,
    deleteWeightEntry,
    refreshWeightHistory: fetchWeightHistory,
  };
}