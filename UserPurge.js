/**
 * @name DMPurge
 * @description Delete your messages in DMs through a UI
 * @version 1.0.0
 * @author You
 */

module.exports = class DMPurge {

    start() {
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

        const dms = BdApi.Webpack.getStore("PrivateChannelStore").getPrivateChannelIds();

        const UserStore = BdApi.Webpack.getStore("UserStore");
        const ChannelStore = BdApi.Webpack.getStore("ChannelStore");

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

        if (document.getElementById("dm-purge-ui")) return;

        const users = this.getDMUsers();

        const options = users.map(u =>
            `<option value="${u.id}">${u.name}</option>`
        ).join("");

        const ui = document.createElement("div");

        ui.id = "dm-purge-ui";

        ui.innerHTML = `
        <div style="
        position:fixed;
        top:50%;
        left:50%;
        transform:translate(-50%,-50%);
        background:#2b2d31;
        padding:20px;
        border-radius:10px;
        z-index:9999;
        width:320px;
        text-align:center;
        ">

        <h3 style="color:white;">DM Message Purge</h3>

        <select id="dm-user-select" style="width:100%;margin-bottom:10px;">
        ${options}
        </select>

        <input id="dm-count" type="number" placeholder="Amount of messages"
        style="width:100%;margin-bottom:10px;">

        <button id="dm-delete">Delete Messages</button>
        <button id="dm-delete-all">Delete All</button>

        <br><br>

        <button id="dm-close">Close</button>

        </div>
        `;

        document.body.appendChild(ui);

        document.getElementById("dm-close").onclick = () => this.removeUI();

        document.getElementById("dm-delete").onclick = () => {

            const count = parseInt(document.getElementById("dm-count").value);
            const user = document.getElementById("dm-user-select").value;

            if (!count) return;

            this.deleteMessages(user, count);

        };

        document.getElementById("dm-delete-all").onclick = () => {

            const user = document.getElementById("dm-user-select").value;

            this.deleteMessages(user, 999999);

        };

    }

    removeUI() {

        const ui = document.getElementById("dm-purge-ui");

        if (ui) ui.remove();

    }

    async deleteMessages(userId, limit) {

        console.log("Deleting messages with:", userId);

        // Placeholder
        // Actual deletion requires message search + API calls

        alert("Delete logic placeholder — can be expanded.");

    }

}
