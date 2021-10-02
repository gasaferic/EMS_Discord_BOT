const Events = require('events');

const fusoOrario = 2;

class Clock {

    MINUTE = 1000 * 1 * 60;
    HOUR = this.MINUTE * 60;
    DAY = this.HOUR * 24;

    constructor (eventEmitter) {
        this.syncClock();
        this.eventEmitter = eventEmitter || new Events.EventEmitter();
        this.eventEmitter.on("onMinuteUpdate", millis => {
            var currentDate = new Date(millis);
            if (currentDate.getUTCHours() == 23 && currentDate.getUTCMinutes() == 59) {
                this.eventEmitter.emit("onDayLastMinute", millis);
            } else if (currentDate.getUTCHours() == 0 && currentDate.getUTCMinutes() == 1) {
                this.eventEmitter.emit("onDayFirstMinute", millis);
            }
        });
    }

    syncClock() {
        this.currentMillis = (Date.now() + (fusoOrario * 60 * 60 * 1000));
        this.lastMillis = { minute: 0, hour: 0, day: 0}
        setInterval(this.tick.bind(this), 1000);
    }

    tick() {
        this.currentMillis += 1000;
        if (this.currentMillis - this.lastMillis.minute > this.MINUTE) {
            this.eventEmitter.emit("onMinuteUpdate", this.currentMillis);
            var currentDate = new Date(this.currentMillis);
            this.lastMillis.minute = this.currentMillis - ((currentDate.getUTCSeconds() * 1000) + currentDate.getUTCMilliseconds());
            if (this.currentMillis - this.lastMillis.hour > this.HOUR) {
                this.eventEmitter.emit("onHourUpdate", this.currentMillis);
                this.lastMillis.hour = this.currentMillis - ((currentDate.getUTCMinutes() * this.MINUTE) + (currentDate.getUTCSeconds() * 1000) + currentDate.getUTCMilliseconds());
                if (this.currentMillis - this.lastMillis.day > this.DAY) {
                    this.eventEmitter.emit("onDayUpdate", this.currentMillis);
                    this.lastMillis.day = this.currentMillis - ((currentDate.getUTCHours() * this.HOUR) + (currentDate.getUTCMinutes() * this.MINUTE) + (currentDate.getUTCSeconds() * 1000) + currentDate.getUTCMilliseconds());
                }
            }
        }
    }

}

module.exports = Clock