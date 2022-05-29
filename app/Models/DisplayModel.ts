export class DisplayModel {

    public on(event: string, handler: (event: any) => void) {
        // @ts-ignore
        this.model.on(event, handler);
    }

}