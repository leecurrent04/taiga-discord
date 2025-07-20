import {EventHandler} from './eventHandler';

export class UserStoryHandler extends EventHandler
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

    const assignedTo = body.data.assigned_to
    const changer = body.by
    const sprint = body.data.milestone

    this.createDiffFields(body)
    this.createExtraFields(body)

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

    const userStory = body.data

    if (userStory.project) {
      this.extraFields.push(
        {
          name: '📚 Project',
          value: `[${userStory.project.name}](${userStory.project.permalink})`,
          inline: true
        },
      )
    }
    if (userStory.status.name) {
      this.extraFields.push({
        name: '📊 Status',
        value: userStory.status.name,
        inline: true
      })
    }
    if (userStory.points && userStory.points.length > 0) {
      this.extraFields.push({
        name: '🎯 Points',
        value: userStory.points
          .filter((p: any) => p.value != null)
          .filter((p: any) => p.value != 0)
          .map((p: any) => `${p.role}: ${p.value}`)
          .join('\n'),
        inline: true
      })
    }
    if (userStory.tags && userStory.tags.length > 0) {
      this.extraFields.push({
        name: '🏷️ Tags',
        value: userStory.tags.join(', '),
        inline: true
      })
    }
    if (userStory.is_blocked) {
      this.extraFields.push({
        name: '⚠️ Blocked',
        value: `**Note**: ${userStory.blocked_note}`,
        inline: false
      })
    }
    if (userStory.description) {
      this.extraFields.push({
        name: '📄 Description',
        value: userStory.description
      })
    }
  }

}