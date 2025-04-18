export const initTabs = () => {
    const tabWrappers = Array.from(document.querySelectorAll('.tabs'));
    tabWrappers.forEach(wrapper => {
        let tabSet = '';
        if (!wrapper.getAttribute('data-tabset-name')) throw new Error('No tab set name provided');
        else tabSet = wrapper.getAttribute('data-tabset-name');

        const tabs =
            Array.from(wrapper.querySelector(':scope>.tab-buttons').querySelectorAll('.tab-button'));
        const tabBodies =
            Array.from(wrapper.querySelectorAll(':scope>.tab-content'));

        tabs.forEach((tab) => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('selected'));
                tab.classList.add('selected');
                tabBodies.forEach(body => body.style.display = 'none');

                const name = tab.getAttribute('data-tabname');
                const content = document.querySelector(`.tab-content[data-tabname="${name}"]`);
                if (content) {
                    content.style.display = 'block';
                }

                globalThis.dispatchEvent(new CustomEvent('tabchange', {
                    detail: { name, tabSet }
                }));
            }
        })

        tabs[0].click();
    })
}