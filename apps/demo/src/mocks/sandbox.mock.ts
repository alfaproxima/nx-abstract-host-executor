interface SandboxApi {
    init?: () => void;
    [key: string]: any;
}

const SANDBOX_MOCK: SandboxApi = {
    init() {
        console.log('App initialized!');
    },
    getText(): void {
        window.dispatchEvent(
            new CustomEvent('get-text',
                {detail: 'Text from the host application API'}));
    }
};

export default SANDBOX_MOCK;
