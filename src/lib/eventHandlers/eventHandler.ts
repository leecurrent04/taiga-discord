
export class EventHandler
{
  title : string = '';
  color : number = 0x0;
  diffFields : any[] = [];
  extraFields: any[] = [];
  descFields: any[] = [];

  COLORS = {
    CREATE: 0x00ff00,  // Green
    DELETE: 0xff0000,  // Red
    CHANGE: 0xffff00,  // Yellow
    CLOSE: 0xdadadc,   // Gray
    COMMENT: 0x7289da  // Sky blue
  }

  handleEvent(body: any) {
    console.log(body);
    console.log(JSON.stringify(body.change, null, 2))

    switch (body.action) {
      case 'create':
        this.title = `Created ${body.type} #${body.data.ref}: ${body.data.subject}`
        this.color = this.COLORS.CREATE
        break
      case 'delete':
        this.title = `Deleted ${body.type} #${body.data.ref}: ${body.data.subject}`
        this.color = this.COLORS.DELETE
        break
      case 'change':
        this.title = `Updated ${body.type} #${body.data.ref}: ${body.data.subject}`
        this.color = this.COLORS.CHANGE
        break
    }
  }

  createBaseEmbed(title: string, url: string, color: number, timestamp: string, changer: any, assignedTo?: any, sprint?: any) {
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

  formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  createDiffFields(body:any)
  {
    this.diffFields = []

    if (body.change?.diff?.subject || body.change?.diff?.name) {
      const from = body.change?.diff?.subject?.from || body.change?.diff?.name?.from || 'Unknown'
      const to = body.change?.diff?.subject?.to || body.change?.diff?.name?.to || 'Unknown'
      this.diffFields.push({
        name: '📝 Name',
        value: `${from} → ${to}`
      })
    }
    if (body.change?.diff?.due_date) {
      let from = body.change.diff.due_date.from
      let to = body.change.diff.due_date.to

      to==null?to:this.formatDate(to)
      from==null?to:this.formatDate(from)

      this.diffFields.push({
        name: '📅 Due date',
        value: `${from} → ${to}`,
      })
    }
    if (body.change?.diff?.is_blocked) {
      const from = body.change.diff.is_blocked.from;

      this.diffFields.push({
        name: `⚠️ ${from==true?'Unblocked':'Blocked'}`,
        value: from==true?``:`**Note**: ${body.data.blocked_note}`,
      })
    }
    if (body.change?.diff?.status) {
      this.diffFields.push({
        name: '📊 Status',
        value: `${body.change.diff.status.from} → ${body.change.diff.status.to}`,
      })
      if(body.change.diff.status.to == 'Closed')
      {
        this.color = this.COLORS.CLOSE;
      }
    }
    if (body.change?.comment) {
      if (body.change.delete_comment_date != null) {
        this.title = `Delete comment on ${body.type} #${body.data.ref}: ${body.data.subject}`
        this.color = this.COLORS.DELETE
      }
      else if (body.change.edit_comment_date != null) {
        this.title = `Update comment on ${body.tyep} #${body.data.ref}: ${body.data.subject}`
        this.color = this.COLORS.CHANGE
      }
      if (body.change.edit_comment_date == null && body.change.delete_comment_date == null) {
        this.title = `New comment on ${body.type} #${body.data.ref}: ${body.data.subject}`
        this.color = this.COLORS.COMMENT
      }
      this.diffFields.push({
        name: '💭 Comment',
        value: body.change.comment
      })
    }
    if(body.change?.diff?.attachments)
    {
      let attachments:any = ''
      let file:any = '', fileUrl:any = ''

      if(body.change.diff.attachments.deleted.length != 0) {
        this.title = `Delete attachment on ${body.type} #${body.data.ref}: ${body.data.subject}`
        this.color = this.COLORS.DELETE
        attachments = body.change.diff.attachments.deleted
      }
      else if(body.change.diff.attachments.changed.length != 0) {
        this.title = `Change attachment on ${body.type} #${body.data.ref}: ${body.data.subject}`
        this.color = this.COLORS.CHANGE
        attachments = body.change.diff.attachments.changed
      }
      else if(body.change.diff.attachments.new.length != 0) {
        this.title = `New attachment on ${body.type} #${body.data.ref}: ${body.data.subject}`
        this.color = this.COLORS.CREATE
        attachments = body.change.diff.attachments.new
      }

      for(let i of attachments)
      {
        file = i.filename
        fileUrl = i.url
      }

      this.diffFields.push({
        name: '📁 Attachment',
        value: `[${file}](${fileUrl})`
      })
    }
  }

  createExtraFields(body: any) {
    this.extraFields = []
  }
}