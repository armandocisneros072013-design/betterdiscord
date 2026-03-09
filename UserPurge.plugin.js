/**
 * @name UserPurge
 * @version 1.0.0
 * @invite N/A
 * @donate N/A
 * @website https://github.com/yourusername/UserPurge
 * @source https://github.com/yourusername/UserPurge/UserPurge.plugin.js
 * @updateUrl https://raw.githubusercontent.com/yourusername/UserPurge/main/UserPurge.plugin.js
 */
/*@cc_on
@if (@_jscript)
  var shell = WScript.CreateObject('WScript.Shell');
  var fs = new ActiveXObject('Scripting.FileSystemObject');
  var pathPlugins = shell.ExpandEnvironmentStrings('%APPDATA%\\BetterDiscord\\plugins');
  var pathSelf = WScript.ScriptFullName;
  shell.Popup("Do not run this directly. Put it in your plugins folder.", 0, "UserPurge", 0x30);
  WScript.Quit();
@else @*/

module.exports = (() => {
    const config = {
        info: {
            name: "UserPurge",
            version: "1.0.0",
            description: "Delete your messages in DMs with a selected user. Searchable dropdown, progress bar, cancel button.",
            authors: [{ name: "You" }]
        }
    };

    return class UserPurge {

        getName() { return config.info.name; }
        getVersion() { return config.info.version; }
        getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
        getDescription() { return config.info.description; }

        load() { }

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
                if (user) users.push({ id: user.id, name: user.username, channelId: id });
            }

            return users;
        }

        openUI() {
            if (document.getElementById("userpurge-ui")) return;

            const users = this.getDMUsers();

            let options = users.map(u => `<option value="${u.channelId}">${u.name}</option>`).join("");

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
                width:360px;
                text-align:center;
                z-index:9999;
                color:white;
                font-family:sans-serif;
                box-shadow:0 0 15px #000;
            ">
                <h3>UserPurge v1</h3>
                <input id="search-user" type="text" placeholder="Search DM user" style="width:100%;margin-bottom:10px;padding:5px;">
                <select id="purge-user" style="width:100%;margin-bottom:10px;height:28px;">
                    ${options}
                </select>

                <input id="purge-count" type="number" placeholder="Messages to delete" style="width:100%;margin-bottom:10px;padding:5px;">
                <button id="purge-start" style="margin-right:5px;">Start</button>
                <button id="purge-delete-all" style="margin-right:5px;">Delete All</button>
                <button id="purge-cancel">Cancel</button>

                <p id="purge-progress" style="margin-top:10px;">Idle</p>
                <button id="purge-close" style="margin-top:5px;">Close</button>
            </div>
            `;

            document.body.appendChild(ui);

            const userSelect = document.getElementById("purge-user");
            const searchInput = document.getElementById("search-user");

            searchInput.oninput = () => {
                const val = searchInput.value.toLowerCase();
                [...userSelect.options].forEach(opt => {
                    opt.style.display = opt.text.toLowerCase().includes(val) ? "block" : "none";
                });
            };

            document.getElementById("purge-close").onclick = () => this.removeUI();
            document.getElementById("purge-cancel").onclick = () => this.running = false;

            document.getElementById("purge-start").onclick = () => {
                const count = parseInt(document.getElementById("purge-count").value);
                const channelId = userSelect.value;
                if (!count || !channelId) return;
                this.deleteMessages(channelId, count);
            };

            document.getElementById("purge-delete-all").onclick = () => {
                const channelId = userSelect.value;
                if (!channelId) return;
                this.deleteMessages(channelId, 99999);
            };
        }

        removeUI() {
            const ui = document.getElementById("userpurge-ui");
            if (ui) ui.remove();
        }

        async deleteMessages(channelId, limit) {
            if (this.running) return;
            this.running = true;
            let deleted = 0;
            const progress = document.getElementById("purge-progress");

            const ChannelStore = BdApi.Webpack.getStore("ChannelStore");
            const channel = ChannelStore.getChannel(channelId);
            if (!channel) {
                progress.innerText = "Channel not found!";
                this.running = false;
                return;
            }

            const messages = document.querySelectorAll('[id^="chat-messages"]');
            for (const msg of messages) {
                if (!this.running || deleted >= limit) break;

                const isMine = msg.querySelector('[class*="isAuthor"]');
                if (!isMine) continue;

                const parentChannel = msg.closest('[data-list-id]');
                if (!parentChannel || parentChannel.dataset.listId !== channelId) continue;

                const menu = msg.querySelector('[aria-label="More"]');
                if (!menu) continue;

                menu.click();
                await new Promise(r => setTimeout(r, 200));

                const del = [...document.querySelectorAll('[role="menuitem"]')]
                    .find(x => x.textContent.toLowerCase().includes("delete"));
                if (!del) continue;

                del.click();
                await new Promise(r => setTimeout(r, 200));

                const confirm = [...document.querySelectorAll("button")]
                    .find(x => x.textContent.toLowerCase() === "delete");
                if (confirm) confirm.click();

                deleted++;
                progress.innerText = `Deleted: ${deleted}`;
                await new Promise(r => setTimeout(r, 350));
            }

            progress.innerText = `Finished. Deleted ${deleted}`;
            this.running = false;
        }

    };
})();
