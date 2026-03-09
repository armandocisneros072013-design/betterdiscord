/**
 * @name UserPurge
 * @description Delete your visible DM messages with a popup menu
 * @version 1.0.0
 * @author You
 */

module.exports = class UserPurge {

    start() {
        this.running = false;
        this.keyHandler = this.keyHandler.bind(this);
        document.addEventListener("keydown", this.keyHandler);
    }

    stop() {
        document.removeEventListener("keydown", this.keyHandler);
        this.removeUI();
    }

    keyHandler(e) {
        if (e.ctrlKey && e.altKey && e.key === "Tab") {
            e.preventDefault();
            this.openUI();
        }
    }

    getDMUsers() {

        const PrivateChannelStore = BdApi.Webpack.getStore("PrivateChannelStore");
        const ChannelStore = BdApi.Webpack.getStore("ChannelStore");
        const UserStore = BdApi.Webpack.getStore("UserStore");

        const dms = PrivateChannelStore.getPrivateChannelIds();
        const users = [];

        for (let id of dms) {

            const channel = ChannelStore.getChannel(id);
            if (!channel || !channel.recipients) continue;

            const user = UserStore.getUser(channel.recipients[0]);

            if (user) {
                users.push({
                    id: user.id,
                    name: user.username
                });
            }
        }

        return users;
    }

    openUI() {

        if (document.getElementById("userpurge-ui")) return;

        const users = this.getDMUsers();

        let options = "";
        users.forEach(u => {
            options += `<option value="${u.id}">${u.name}</option>`;
        });

        const ui = document.createElement("div");
        ui.id = "userpurge-ui";

        ui.innerHTML = `
        <div style="
        position:fixed;
        top:50%;
        left:50%;
        transform:translate(-50%,-50%);
        background:#2b2d31;
        padding:20px;
        border-radius:12px;
        width:340px;
        text-align:center;
        z-index:9999;
        color:white;
        font-family:sans-serif;
        ">

        <h3>UserPurge</h3>

        <select id="purge-user" style="width:100%;margin-bottom:10px;">
        ${options}
        </select>

        <input id="purge-count" type="number"
        placeholder="Messages to delete"
        style="width:100%;margin-bottom:10px;padding:5px;">

        <button id="purge-start">Start</button>
        <button id="purge-cancel">Cancel</button>

        <p id="purge-progress">Idle</p>

        <button id="purge-close">Close</button>

        </div>
        `;

        document.body.appendChild(ui);

        document.getElementById("purge-close").onclick = () => this.removeUI();

        document.getElementById("purge-start").onclick = () => {

            const count = parseInt(document.getElementById("purge-count").value);
            if (!count) return;

            this.deleteVisible(count);
        };

        document.getElementById("purge-cancel").onclick = () => {
            this.running = false;
        };
    }

    removeUI() {
        const ui = document.getElementById("userpurge-ui");
        if (ui) ui.remove();
    }

    async deleteVisible(limit) {

        if (this.running) return;

        this.running = true;

        let deleted = 0;

        const progress = document.getElementById("purge-progress");

        const messages = document.querySelectorAll('[id^="chat-messages"]');

        for (const msg of messages) {

            if (!this.running) break;
            if (deleted >= limit) break;

            const mine = msg.querySelector('[class*="isAuthor"]');
            if (!mine) continue;

            const menu = msg.querySelector('[aria-label="More"]');
            if (!menu) continue;

            menu.click();

            await new Promise(r => setTimeout(r,200));

            const del = [...document.querySelectorAll('[role="menuitem"]')]
                .find(x => x.textContent.toLowerCase().includes("delete"));

            if (!del) continue;

            del.click();

            await new Promise(r => setTimeout(r,200));

            const confirm = [...document.querySelectorAll("button")]
                .find(x => x.textContent.toLowerCase() === "delete");

            if (confirm) confirm.click();

            deleted++;

            progress.innerText = "Deleted: " + deleted;

            await new Promise(r => setTimeout(r,400));
        }

        progress.innerText = "Finished. Deleted " + deleted;

        this.running = false;
    }

};
