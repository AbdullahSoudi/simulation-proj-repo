'use server'

import { revalidatePath } from 'next/cache'

import { getSupabaseActionClient } from '@/lib/supabase/server'

export async function generateChecklistAction(episodeId: string): Promise<void> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // Check if checklist already exists
  const { data: existing } = await supabase
    .from('episode_checklists')
    .select('id')
    .eq('episode_id', episodeId)
    .maybeSingle()

  if (existing) {
    throw new Error('Checklist already exists for this episode.')
  }

  // Find active preop template
  const { data: template, error: templateError } = await supabase
    .from('checklist_templates')
    .select('id')
    .eq('type', 'preop')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (templateError || !template) {
    throw new Error('No active pre-op checklist template found.')
  }

  // Get template items
  const { data: templateItems, error: itemsError } = await supabase
    .from('checklist_template_items')
    .select('label, sort_order')
    .eq('template_id', template.id)
    .order('sort_order', { ascending: true })

  if (itemsError || !templateItems || templateItems.length === 0) {
    throw new Error('Template has no items.')
  }

  // Create episode checklist
  const { data: checklist, error: checklistError } = await supabase
    .from('episode_checklists')
    .insert({
      episode_id: episodeId,
      template_id: template.id,
    } as any)
    .select('id')
    .single()

  if (checklistError || !checklist?.id) {
    throw new Error(checklistError?.message || 'Failed to create checklist.')
  }

  // Copy template items to episode checklist items
  const itemsToInsert = templateItems.map((item: any) => ({
    episode_checklist_id: checklist.id,
    label: item.label,
    sort_order: item.sort_order,
    status: 'pending',
  }))

  const { error: insertError } = await supabase
    .from('episode_checklist_items')
    .insert(itemsToInsert as any)

  if (insertError) {
    // Best-effort cleanup
    await supabase.from('episode_checklists').delete().eq('id', checklist.id)
    throw new Error(insertError.message || 'Failed to create checklist items.')
  }

  revalidatePath(`/app/episodes/${episodeId}`)
}

export async function updateChecklistItemAction(
  itemId: string,
  status: 'pending' | 'done' | 'not_applicable',
  notes?: string | null
): Promise<void> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  const updateData: any = {
    status,
    notes: notes?.trim() || null,
  }

  if (status === 'done') {
    updateData.completed_at = new Date().toISOString()
    updateData.completed_by = user.id
  } else {
    updateData.completed_at = null
    updateData.completed_by = null
  }

  const { error } = await supabase
    .from('episode_checklist_items')
    .update(updateData)
    .eq('id', itemId)

  if (error) {
    throw new Error(error.message || 'Failed to update checklist item.')
  }

  // Revalidate the episode page
  const { data: item } = await supabase
    .from('episode_checklist_items')
    .select('episode_checklist_id')
    .eq('id', itemId)
    .maybeSingle()

  if (item) {
    const { data: checklist } = await supabase
      .from('episode_checklists')
      .select('episode_id')
      .eq('id', (item as any).episode_checklist_id)
      .maybeSingle()

    if (checklist) {
      revalidatePath(`/app/episodes/${(checklist as any).episode_id}`)
    }
  }
}
