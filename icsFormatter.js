//https://github.com/nwcell/ics.js/pull/12

/* global saveAs, Blob, BlobBuilder, console */
/* exported ics */

var ics = function(name) {
    'use strict';

    if (navigator.userAgent.indexOf('MSIE') > -1 && navigator.userAgent.indexOf('MSIE 10') == -1) {
        console.log('Unsupported Browser');
        return;
    }

    var SEPARATOR = (navigator.appVersion.indexOf('Win') !== -1) ? '\r\n' : '\n';
    var calendarEvents = [];
    var calendarStart = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:' + name
    ].join(SEPARATOR);
    var calendarEnd = SEPARATOR + 'END:VCALENDAR';
    var BYDAY_VALUES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

    return {
        /**
         * Returns events array
         * @return {array} Events
         */
        'events': function() {
            return calendarEvents;
        },

        /**
         * Returns calendar
         * @return {string} Calendar in iCalendar format
         */
        'calendar': function() {
            return calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;
        },

        /**
         * Add event to the calendar
         * @param  {string} subject     Subject/Title of event
         * @param  {string} description Description of event
         * @param  {string} location    Location of event
         * @param  {string} begin       Beginning date of event
         * @param  {string} stop        Ending date of event
         */
        'addEvent': function(subject, description, location, begin, stop, rrule) {
            // I'm not in the mood to make these optional... So they are all required
            if (typeof subject === 'undefined' ||
                typeof description === 'undefined' ||
                typeof location === 'undefined' ||
                typeof begin === 'undefined' ||
                typeof stop === 'undefined'
            ) {
                return false;
            }

            // validate rrule
            if (rrule) {
                if (!rrule.rule) {
                    if (rrule.freq !== 'YEARLY' && rrule.freq !== 'MONTHLY' && rrule.freq !== 'WEEKLY' && rrule.freq !== 'DAILY') {
                        throw "Recurrence rule frequency must be provided and be one of the following: 'YEARLY', 'MONTHLY', 'WEEKLY', or 'DAILY'";
                    }

                    if (rrule.until) {
                        if (isNaN(Date.parse(rrule.until))) {
                            throw "Recurrence rule 'until' must be a valid date string";
                        }
                    }

                    if (rrule.interval) {
                        if (isNaN(parseInt(rrule.interval))) {
                            throw "Recurrence rule 'interval' must be an integer";
                        }
                    }

                    if (rrule.count) {
                        if (isNaN(parseInt(rrule.count))) {
                            throw "Recurrence rule 'count' must be an integer";
                        }
                    }

                    if (typeof rrule.byday !== 'undefined') {
                        if ( (Object.prototype.toString.call(rrule.byday) !== '[object Array]') ) {
                            throw "Recurrence rule 'byday' must be an array";
                        }

                        if (rrule.byday.length > 7) {
                            throw "Recurrence rule 'byday' array must not be longer than the 7 days in a week";
                        }

                        // Filter any possible repeats
                        rrule.byday = rrule.byday.filter(function(elem, pos) {
                            return rrule.byday.indexOf(elem) == pos;
                        });

                        for (var i = 0; i < rrule.byday.length; i++) {
                            if (BYDAY_VALUES.indexOf(rrule.byday[i]) < 0) {
                                throw "Recurrence rule 'byday' values must include only the following: 'SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'";
                            }
                        }
                    }
                }
            }

            var start = moment.utc(begin).format('YYYYMMDD[T]HHmmss[Z]');
            var end = moment.utc(stop).format('YYYYMMDD[T]HHmmss[Z]')

            // recurrence rule vars
            var rruleString;
            if (rrule) {
                if (rrule.rule) {
                    rruleString = rrule.rule;
                } else {
                    rruleString = 'RRULE:FREQ=' + rrule.freq;

                    if (rrule.until) {
                        var uDate = moment.utc(rrule.until);
                        rruleString += ';UNTIL=' + uDate.format("YYYYMMDD[T]000000[Z]");
                    }

                    if (rrule.interval) {
                        rruleString += ';INTERVAL=' + rrule.interval;
                    }

                    if (rrule.count) {
                        rruleString += ';COUNT=' + rrule.count;
                    }

                    if (rrule.byday && rrule.byday.length > 0) {
                        rruleString += ';BYDAY=' + rrule.byday.join(',');
                    }
                }
            }

            var stamp = new Date().toISOString();

            var calendarEvent = [
                'BEGIN:VEVENT',
                'CLASS:PUBLIC',
                'SUMMARY;LANGUAGE=en-us:' + subject,
                'UID:' + start + "-" + subject,
                'DESCRIPTION:' + description.replace('\r\n', '\\n'),
                'DTSTART:' + start,
                'DTEND:' + end,
                'DTSTAMP:' + stamp.substring(0, stamp.length - 13).replace(/[-]/g, '') + '000000Z',
                'LOCATION:' + location,
                'TRANSP:TRANSPARENT',
                'END:VEVENT'
            ];

            if (rruleString) {
                calendarEvent.splice(4, 0, rruleString);
            }

            calendarEvent = calendarEvent.join(SEPARATOR);

            calendarEvents.push(calendarEvent);
            return calendarEvent;
        },

        /**
         * Download calendar using the saveAs function from filesave.js
         * @param  {string} filename Filename
         * @param  {string} ext      Extention
         */
        'download': function(filename, ext) {
            if (calendarEvents.length < 1) {
                return false;
            }

            ext = (typeof ext !== 'undefined') ? ext : '.ics';
            filename = (typeof filename !== 'undefined') ? filename : 'calendar';
            var calendar = calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;

            var blob;
            if (navigator.userAgent.indexOf('MSIE 10') === -1) { // chrome or firefox
                blob = new Blob([calendar]);
            } else { // ie
                var bb = new BlobBuilder();
                bb.append(calendar);
                blob = bb.getBlob('text/x-vCalendar;charset=' + document.characterSet);
            }
            saveAs(blob, filename + ext);
            return calendar;
        }
    };
};
