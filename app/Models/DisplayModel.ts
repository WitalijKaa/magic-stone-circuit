export class DisplayModel {

    public on(event: string, handler: (event: any) => void) {
        switch (event) {
            case 'click':
                // @ts-ignore
                this.model.interactive = true;
                break;
        }

        // @ts-ignore
        this.model.on(event, handler);
    }

}