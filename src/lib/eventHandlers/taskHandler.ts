const COLORS = {
  CREATE: 0x00ff00,  // Green
  DELETE: 0xff0000,  // Red
  CHANGE: 0xffff00,  // Yellow
}

const EMBED = {
  FOOTER: {
    ICON_URL: 'https://cdn.discordapp.com/attachments/596130529129005056/596406037859401738/favicon.png',
    TEXT: 'Taiga.io'
  },
  AUTHOR: {
    ICON_URL: 'https://cdn.discordapp.com/attachments/596130529129005056/596406037859401738/favicon.png',
    NAME: 'Taiga'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

function createBaseEmbed(title: string, url: string, color: number, timestamp: string, changer: any, assignedTo?: any, sprint?: any) {
  return {
    author: {
      name: title,
      url: url
    },
    color: color,
    timestamp: timestamp,
    thumbnail: changer?.photo ? { url: changer.photo } : undefined,
    fields: [
      ...(assignedTo ? [{
        name: '👥 Assigned To',
        value: `[${assignedTo.full_name}](${assignedTo.permalink})`,
        inline: true
      }] : []),
      ...(changer ? [{
        name: '📝 Changed By',
        value: `[${changer.full_name}](${changer.permalink})`,
        inline: true
      }] : []),
      ...(sprint ? [{
        name: '🏃 Sprint',
        value: sprint.name,
        inline: true
      }] : [])
    ]
  }
}

export function handleTaskEvent(body: any) {
  console.log(JSON.stringify(body.change, null, 2));

  const task = body.data
  let title = '', color = COLORS.CHANGE, extraFields: any[] = []
  const assignedTo = task.assigned_to
  const changer = body.by
  const sprint = task.milestone

  const diff_change = body.change
  let diffFields : any[] = []

  let statusField
  if (body.action === 'change' && body.change?.diff?.status) {
    statusField = {
      name: '📊 Status',
      value: `${body.change.diff.status.from} → ${body.change.diff.status.to}`,
      inline: true
    }
  } else {
    statusField = {
      name: '📊 Status',
      value: task.status.name,
      inline: true
    }
  }

  switch (body.action) {
    case 'create':
      title = `📋 Created Task #${task.ref}: ${task.subject}`
      color = COLORS.CREATE
      break
    case 'delete':
      title = `🗑️ Deleted Task #${task.ref}: ${task.subject}`
      color = COLORS.DELETE
      break
    case 'change':
      title = `✏️ Updated Task #${task.ref}: ${task.subject}`
      color = COLORS.CHANGE

      if (body.change?.diff?.assigned_to) {
	      diffFields.push({
		      name: '💭 Comment',
		      value: `${body.change.diff.assigned_to.from} to ${body.change.diff.assigned_to.to}`
	      })
      }

      if (body.change?.diff?.estimated_start) {
	      diffFields.push({
		      name: '📅 Start Date',
		      value: `${formatDate(body.change.diff.estimated_start.from)} → ${formatDate(body.change.diff.estimated_start.to)}`,
		      inline: true
	      })
      }

      if (body.change?.diff?.estimated_finish) {
	      diffFields.push({
		      name: '📅 End Date',
		      value: `${formatDate(body.change.diff.estimated_finish.from)} → ${formatDate(body.change.diff.estimated_finish.to)}`,
		      inline: true
	      })
      }

      if (body.change?.diff?.subject || body.change?.diff?.name) {
	      const from = body.change?.diff?.subject?.from || body.change?.diff?.name?.from || 'Unknown'
	      const to = body.change?.diff?.subject?.to || body.change?.diff?.name?.to || 'Unknown'
	      diffFields.push({
		      name: '📝 Name',
		      value: `${from} → ${to}`
	      })
      }

      if (body.change?.diff?.status) {
	      diffFields.push({
		      name: '📊 Status',
		      value: `${body.change.diff.status.from} → ${body.change.diff.status.to}`,
		      inline: true
	      })
      } else if (body.change?.diff?.closed) {
	      diffFields.push({
		      name: '📊 Status',
		      value: `${body.change.diff.closed.from ? '🔒 Closed' : '🔓 Open'} → ${body.change.diff.closed.to ? '🔒 Closed' : '🔓 Open'}`,
		      inline: true
	      })
      }

      if (body.change?.comment) {
	      console.log(body.change.delete_comment_date);
	      if(body.change.delete_comment_date != null){
		      title = `✏️Delete Comment on task #${task.ref}: ${task.subject}`
		      color = COLORS.DELETE
	      }
	      else if(body.change.edit_comment_date != null){
		      title = `✏️Update Comment on task #${task.ref}: ${task.subject}`
		      color = COLORS.CHANGE
	      }
	      else{
		      title = `✏️New Comment on task #${task.ref}: ${task.subject}`
		      color = COLORS.CREATE
	      }
	      diffFields.push({
		      name: '💭 Comment',
		      value: body.change.comment
	      })
      }
      break
  }

  if (task.user_story) {
    extraFields.push({
      name: '📝 User Story',
      value: `[${task.user_story.subject}](${task.user_story.permalink})`,
      inline: true
    })
  }
  if (task.milestone) {
    extraFields.push({
      name: '🏃 Sprint',
      value: task.milestone.name,
      inline: true
    })
  }
  if (task.tags && task.tags.length > 0) {
    extraFields.push({
      name: '🏷️ Tags',
      value: task.tags.join(', '),
      inline: true
    })
  }
  if (task.is_blocked) {
    extraFields.push({
      name: '⚠️ Blocked',
      value: `**Note**: ${task.blocked_note}`,
      inline: false
    })
  }
  if (task.is_iocaine) {
    extraFields.push({
      name: '💊 Iocaine',
      value: 'Yes',
      inline: true
    })
  }
  if (task.description) {
    extraFields.push({
      name: '📄 Description',
      value: task.description
    })
  }

  return {
    ...createBaseEmbed(title, task.permalink, color, body.date, changer, assignedTo, sprint),
    fields: [
      ...diffFields,
      {
        name: '📚 Project',
        value: `[${task.project.name}](${task.project.permalink})`,
        inline: true
      },
      {
        name: '👤 Updated By',
        value: `[${changer.full_name}](${changer.permalink})`,
        inline: true
      },
      statusField,
      ...extraFields
    ]
  }
} 
