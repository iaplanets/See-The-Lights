/****************************************
 * Lottery Plug-in for Pokémon Showdown
 *            Created by:
 *         HoeenHero and Insist
 ****************************************/

"use strict";

class Lottery {
	constructor(room, user) {
		this.players = [];
		this.room = room;
		room.lottoNumber = room.lottoNumber ? room.lottoNumber++ : 1;
		this.lottoNumber = room.lottoNumber;
		this.costToJoin = 3;
		this.room.add(`|uhtml|lottery-${this.lottoNumber}|<div class="broadcast-blue"><p style="font-size: 14pt; text-align: center">A new <strong>Lottery drawing</strong> is starting!</p><p style="font-size: 9pt; text-align: center"><button name="send" value="/lotto join">Join</button><br /><strong>DISCLAIMER: Joining costs ${this.costToJoin} ${moneyPlural}!!!!</strong></p></div>`, true);
		this.timer = setTimeout(() => {
			if (this.players.length < 1) {
				this.room.add('|uhtmlchange|lottery-' + this.lottoNumber + '|<div class="broadcast-red"><p style="text-align: center; font-size: 14pt>This Lottery drawing has ended due to lack of users.</p></div>');
				return this.end();
			}
			this.drawWinner();
		}, 1000 * 60 * 60 * 24);
	}

	onConnect(user, connection, room) {
		user.sendTo(this.room, '|uhtml|lottery-' + this.lottoNumber + '|<div class="broadcast-blue"><p style="text-align: center; font-size: 14pt>A Lottery Drawing has started looking for players!<hr /><br />For the price of 3 ' + moneyPlural + ', you can earn 5 ' + moneyPlural + ' plus one ' + moneyName + ' per user who joins.</p><br /><button name="send" value="/lottery join">Click here to join the Lottery</button></div>');
	}

	drawWinner() {
		let winner = this.players[Math.floor(Math.random() * this.players.length)];
		let basePrize = 5;
		let lottoPrize = basePrize + this.players.length + this.costToJoin;
		this.room.add(`|html|<div class="infobox"><center><strong>Congratulations</strong> ${Server.nameColor(Users(winner), true)}!!! You have won the reward of ${lottoPrize} ${moneyPlural}</center></div>`);
		Economy.writeMoney(winner, lottoPrize);
		Economy.logTransaction(`${winner} has won the Lottery prize of ${lottoPrize} ${moneyPlural}`);
		this.end();
	}

	joinLottery(user) {
		Economy.readMoney(user.userid, money => {
			if (this.players.includes(user)) return user.sendTo(this.room, "You have already joined this Lottery drawing.");
			if (money < this.costToJoin) {
				user.sendTo(this.room, 'You do not have enough ' + moneyPlural + ' to join.');
				return;
			}
			Economy.writeMoney(user.userid, -this.costToJoin, () => {
				Economy.readMoney(user.userid, money => {
					Economy.logTransaction(user.name + " entered a Lottery drawing for " + this.costToJoin + " " + moneyPlural + ".");
				});
			});
			this.players.push(user);
		});
	}

	leaveLottery(user) {
		Economy.writeMoney(user.userid, this.costToJoin, () => {
			if (!this.players.includes(user)) return user.sendTo(this.room, `You are not currently in the Lottery drawing in this room..`);
			Economy.logTransaction(user.name + " has left the Lottery drawing, and has been refunded their " + this.costToJoin + " " + moneyPlural + ".");
		});
	}

	end(user) {
		this.room.add(`|uhtmlchange|lottery-${this.lottoNumber}|<div class="infobox">This Lottery Drawing has ended.</div>`, true);
		clearTimeout(this.timer);
		delete this.room.lottery;
	}
}

exports.commands = {
	lotto: "lottery",
	lottery: {
		create: "new",
		make: "new",
		new: function (target, room, user) {
			if (room.lottery) return this.sendReply("A join-able Lottery drawing is already active.");
			if (!this.can('mute', null, room)) return false;
			if (!room.isOfficial) return this.sendReply('Lottery drawings can only be created in Official Chatrooms.');
			this.privateModCommand(`(A new Lottery drawing has been created.)`);
			room.lottery = new Lottery(room, user);
		},
		j: "join",
		join: function (target, room, user) {
			if (!room.lottery) return this.sendReply("There is no join-able Lottery drawing going on right now.");
			if (!this.canTalk()) return this.sendReply("You must be able to talk to join a Lottery drawing.");
			if (!user.registered) return this.sendReply("To join the Lottery, you must be on a registered account.");
			room.lottery.joinLottery(user);
		},
		part: "leave",
		l: "leave",
		leave: function (target, room, user) {
			if (!room.lottery) return this.sendReply("There is no active Lottery drawing in this room.");
			room.lottery.leaveLottery(user);
		},
		forcestart: "start",
		begin: "start",
		start: function (target, room, user) {
			if (!this.can('mute', null, room)) return;
			if (!room.lottery) return this.sendReply("There is not any Lottery drawing available to be started.");
			if (room.lottery.playerCount < 1) return this.sendReply("You can't start a Lottery drawing without at least one user joining.");
			this.privateModCommand(`(A new Lottery drawing has been started early.)`);
			room.lottery.drawWinner();
		},
		cancel: "end",
		end: function (target, room, user) {
			if (!this.can('mute', null, room)) return;
			if (!room.lottery) return this.sendReply("There is no Lottery drawing going on right now.");
			this.privateModCommand(`(The Lottery drawing was forcefully ended.)`);
			room.lottery.end(user);
		},
	},
};
