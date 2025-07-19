const COLORS = {
  CREATE: 0x00ff00,  // Green
  DELETE: 0xff0000,  // Red
  CHANGE: 0xffff00,  // Yellow
  CLOSE: 0xdadadc,   // Gray
  COMMENT: 0x7289da  // Sky blue
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

function createBaseEmbed(title: string, url: string, color: number, timestamp: string, changer: any) {
  let img = changer.photo.split('?')[0];
  return {
    author: {
      icon_url: changer?.photo ? img : undefined,
      name : `${changer.username} (${changer.full_name})`,
      url: `${changer.permalink}`
    },
    color: color,
    timestamp: timestamp,
    title: title,
    url: url
  }
}

export function handleTaskEvent(body: any) {
  console.log(body);
  console.log(JSON.stringify(body.change, null, 2));

  const task = body.data
  let title = '', color = COLORS.CHANGE

  let extraFields: any[] = []
  let diffFields : any[] = []
  let descFields : any[] = []

  switch (body.action) {
    case 'create':
      title = `Created Task #${task.ref}: ${task.subject}`
      color = COLORS.CREATE
      break
    case 'delete':
      title = `Deleted Task #${task.ref}: ${task.subject}`
      color = COLORS.DELETE
      break
    case 'change':
      title = `Updated Task #${task.ref}: ${task.subject}`
      color = COLORS.CHANGE
      break
  }

  // diff_Fields
  if (body.change?.diff?.subject || body.change?.diff?.name) {
    const from = body.change?.diff?.subject?.from || body.change?.diff?.name?.from || 'Unknown'
    const to = body.change?.diff?.subject?.to || body.change?.diff?.name?.to || 'Unknown'
    diffFields.push({
      name: '📝 Name',
      value: `${from} → ${to}`
    })
  }
  if (body.change?.diff?.due_date) {
    diffFields.push({
      name: '📅 Due date',
      value: `${formatDate(body.change.diff.due_date.from)} → ${formatDate(body.change.diff.due_date.to)}`,
    })
  }
  if (body.change?.diff?.is_blocked) {
    const from = body.change.diff.is_blocked.from;

    diffFields.push({
      name: `⚠️ ${from==true?'Unblocked':'Blocked'}`,
      value: from==true?``:`**Note**: ${task.blocked_note}`,
    })
  }
  if (body.change?.diff?.status) {
    diffFields.push({
      name: '📊 Status',
      value: `${body.change.diff.status.from} → ${body.change.diff.status.to}`,
    })
    if(body.change.diff.status.to == 'Closed')
    {
      color = COLORS.CLOSE;
    }
  }
  if (body.change?.comment) {
    if (body.change.delete_comment_date != null) {
      title = `Delete comment on task #${task.ref}: ${task.subject}`
      color = COLORS.DELETE
    }
    else if (body.change.edit_comment_date != null) {
      title = `Update comment on task #${task.ref}: ${task.subject}`
      color = COLORS.CHANGE
    }
    if (body.change.edit_comment_date == null && body.change.delete_comment_date == null) {
      title = `New comment on task #${task.ref}: ${task.subject}`
      color = COLORS.COMMENT
    }
    diffFields.push({
      name: '💭 Comment',
      value: body.change.comment
    })
  }
  if(body.change?.diff?.attachments)
  {
    let attachments:any = ''
    let file:any = '', fileUrl:any = ''

    if(body.change.diff.attachments.deleted.length != 0) {
      title = `Delete attachment on task #${task.ref}: ${task.subject}`
      color = COLORS.DELETE
      attachments = body.change.diff.attachments.deleted
    }
    else if(body.change.diff.attachments.changed.length != 0) {
      title = `Change attachment on task #${task.ref}: ${task.subject}`
      color = COLORS.CHANGE
      attachments = body.change.diff.attachments.changed
    }
    else if(body.change.diff.attachments.new.length != 0) {
      title = `New attachment on task #${task.ref}: ${task.subject}`
      color = COLORS.CREATE
      attachments = body.change.diff.attachments.new
    }

    for(let i of attachments)
    {
      file = i.filename
      fileUrl = i.url
    }

    diffFields.push({
      name: '📁 Attachment',
      value: `[${file}](${fileUrl})`
    })
  }

  // extraFields
  if (task.project)
  {
    extraFields.push(
      {
        name: '📚 Project',
        value: `[${task.project.name}](${task.project.permalink})`,
        inline: true
      },
    )
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
      value: `[${task.milestone.name}](${task.milestone.permalink})`,
      inline: true
    })
  }
  if (task.status.name) {
    extraFields.push({
      name: '📊 Status',
      value: task.status.name,
      inline: true
    })
  }
  if (task.assigned_to != null)
  {
    extraFields.push({
      name: '👥 Assigned To',
      value: `[${task.assigned_to.full_name}](${task.assigned_to.permalink})`,
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
  
  // descField
  if (task.description) {
    descFields.push({
      name: '📄 Description',
      value: task.description
    })
  }

  const baseEmbed = createBaseEmbed(title, body.data.permalink, color, body.date, body.by);

  return {
    ...baseEmbed,
    fields: [
      ...diffFields,
      ...extraFields,
      ...descFields
    ]
  }
} 
