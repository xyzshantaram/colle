import { cf, getName, confirm } from "../deps.js";

const PasteItem = (item, client) => {
    const name = getName(item);
    console.log(name);
    const [elt, del] = cf.nu('li.paste-item')
        .gimme('.delete-item')
        .html`<div class=item-name>${name}</div>
        <ul>
            <li><a class=view-item target="_blank" href="${client.makeUrl("/view/" + item.uuid)}">View</a></li>
            <li><a class=delete-item href="javascript:void(0)">Delete</a></li>
        </ul>`
        .done();

    del.onclick = async () => {
        if (await confirm('Are you sure you want to delete this paste?')) {
            await client.deleteFile(item.uuid);
            location.reload();
        }
    }

    return elt;
}

export const UserPastes = async (client) => {
    const pastes = await client.listFiles() || [];
    const [elt, list] = cf.nu('details#user-pastes')
        .gimme('ul')
        .html`
        <summary><h2>Your pastes</h2></summary>
        <ul class=user-paste-list></ul>`
        .done();

    list.append(...pastes.map(paste => PasteItem(paste, client)));
    return [elt];
}