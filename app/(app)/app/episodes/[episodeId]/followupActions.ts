'use server'

import { revalidatePath } from 'next/cache'

import { getSupabaseActionClient } from '@/lib/supabase/server'

export async function generateFollowupPlanAction(episodeId: string): Promise<void> {
  const supabase = await getSupabaseActionClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated.')
  }

  // Check if plan already exists
  const { data: existing } = await supabase
    .from('episode_followup_plans')
    .select('id')
    .eq('episode_id', episodeId)
    .maybeSingle()

  if (existing) {
    throw new Error('Follow-up plan already exists for this episode.')
  }

  // Get episode scheduled_at
  const { data: episode, error: episodeError } = await supabase
    .from('episodes')
    .select('scheduled_at')
    .eq('id', episodeId)
    .maybeSingle()

  if (episodeError || !episode) {
    throw new Error('Episode not found.')
  }

  if (!episode.scheduled_at) {
    throw new Error('Episode must have a scheduled date/time before generating follow-up plan.')
  }

  const scheduledAt = new Date(episode.scheduled_at)

  // Find active followup template
  const { data: template, error: templateError } = await supabase
    .from('followup_templates')
    .select('id')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (templateError || !template) {
    throw new Error('No active follow-up template found.')
  }

  // Get template items
  const { data: templateItems, error: itemsError } = await supabase
    .from('followup_template_items')
    .select('title, offset_days, sort_order')
    .eq('template_id', template.id)
    .order('sort_order', { ascending: true })

  if (itemsError || !templateItems || templateItems.length === 0) {
    throw new Error('Template has no items.')
  }

  // Create follow-up plan
  const { data: plan, error: planError } = await supabase
    .from('episode_followup_plans')
    .insert({
      episode_id: episodeId,
      template_id: template.id,
    } as any)
    .select('id')
    .single()

  if (planError || !plan?.id) {
    throw new Error(planError?.message || 'Failed to create follow-up plan.')
  }

  // Create tasks from template items
  const tasksToInsert = templateItems.map((item: any) => {
    const dueDate = new Date(scheduledAt)
    dueDate.setDate(dueDate.getDate() + item.offset_days)
    // Keep same time as scheduled_at
    dueDate.setHours(scheduledAt.getHours(), scheduledAt.getMinutes(), scheduledAt.getSeconds())

    return {
      episode_id: episodeId,
      plan_id: plan.id,
      title: item.title,
      due_at: dueDate.toISOString(),
      status: 'pending',
    }
  })

  const { error: tasksError } = await supabase.from('episode_tasks').insert(tasksToInsert as any)

  if (tasksError) {
    // Best-effort cleanup
    await supabase.from('episode_followup_plans').delete().eq('id', plan.id)
    throw new Error(tasksError.message || 'Failed to create follow-up tasks.')
  }

  revalidatePath(`/app/episodes/${episodeId}`)
}

export async function updateTaskStatusAction(
  taskId: string,
  status: 'pending' | 'done' | 'skipped'
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
  }

  if (status === 'done') {
    updateData.completed_at = new Date().toISOString()
    updateData.completed_by = user.id
  } else {
    updateData.completed_at = null
    updateData.completed_by = null
  }

  const { error } = await supabase
    .from('episode_tasks')
    .update(updateData)
    .eq('id', taskId)

  if (error) {
    throw new Error(error.message || 'Failed to update task status.')
  }

  // Revalidate the episode page
  const { data: task } = await supabase
    .from('episode_tasks')
    .select('episode_id')
    .eq('id', taskId)
    .maybeSingle()

  if (task) {
    revalidatePath(`/app/episodes/${(task as any).episode_id}`)
  }
}
