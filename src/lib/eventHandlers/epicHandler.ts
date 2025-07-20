import {EventHandler} from './eventHandler';

export class EpicHandler extends EventHandler
{
  title : string = '';
  color : number = 0x0;
  diffFields : any[] = [];
  extraFields: any[] = []
  descFields: any[] = []

  handleEvent(body: any) {
    super.handleEvent(body)

    this.createDiffFields(body)
    this.createExtraFields(body)
    this.createDescFields(body)

    return {
      ...this.createBaseEmbed(body, this.title, this.color),
      fields: [
        ...this.diffFields,
        ...this.extraFields,
        ...this.descFields
      ]
    }
  }
}
