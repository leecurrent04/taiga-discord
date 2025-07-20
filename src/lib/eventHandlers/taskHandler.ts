import {EventHandler} from './eventHandler';

export class TaskHandler extends EventHandler
{
  title : string = '';
  color : number = 0x0;
  diffFields : any[] = [];
  extraFields: any[] = []
  descFields: any[] = []

  COLORS = {
    CREATE: 0x00ff00,  // Green
    DELETE: 0xff0000,  // Red
    CHANGE: 0xffff00,  // Yellow
    CLOSE: 0xdadadc,   // Gray
    COMMENT: 0x7289da  // Sky blue
  }

  handleEvent(body: any) {
    super.handleEvent(body)

    const task = body.data;
    const assignedTo = body.data.assigned_to;
    const changer = body.by;
    const sprint = body.data.milestone;

    this.createDiffFields(body)
    this.createExtraFields(body)

    // descField
    if (task.description) {
      this.descFields.push({
        name: '📄 Description',
        value: task.description
      })
    }

    return {
      ...this.createBaseEmbed(this.title, body.data.permalink, this.color, body.date, changer, assignedTo, sprint),
      fields: [
        ...this.diffFields,
        ...this.extraFields,
        ...this.descFields
      ]
    }
  }

  createExtraFields(body: any) {
    this.extraFields = []

    const task = body.data;

    if (task.project) {
      this.extraFields.push(
        {
          name: '📚 Project',
          value: `[${task.project.name}](${task.project.permalink})`,
          inline: true
        },
      )
    }
    if (task.user_story) {
      this.extraFields.push({
        name: '📝 User Story',
        value: `[${task.user_story.subject}](${task.user_story.permalink})`,
        inline: true
      })
    }
    if (task.milestone) {
      this.extraFields.push({
        name: '🏃 Sprint',
        value: `[${task.milestone.name}](${task.milestone.permalink})`,
        inline: true
      })
    }
    if (task.status.name) {
      this.extraFields.push({
        name: '📊 Status',
        value: task.status.name,
        inline: true
      })
    }
    if (task.assigned_to != null) {
      this.extraFields.push({
        name: '👥 Assigned To',
        value: `[${task.assigned_to.full_name}](${task.assigned_to.permalink})`,
        inline: true
      })
    }
    if (task.tags && task.tags.length > 0) {
      this.extraFields.push({
        name: '🏷️ Tags',
        value: task.tags.join(', '),
        inline: true
      })
    }
    if (task.is_blocked) {
      this.extraFields.push({
        name: '⚠️ Blocked',
        value: `**Note**: ${task.blocked_note}`,
        inline: false
      })
    }
    if (task.is_iocaine) {
      this.extraFields.push({
        name: '💊 Iocaine',
        value: 'Yes',
        inline: true
      })
    }

  } 
}