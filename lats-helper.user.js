// ==UserScript==
// @name           LATS Helper
// @namespace      https://chrome.google.com/webstore/detail/lats-helper/jmkgmheopekejeiondjdokbdckkeikeh?hl=en
// @include        https://oftlats.cma.com/*
// @include        https://*.lats.ny.gov/*
// @include        https://*.cma.com/*
// @version        1.2.3
// @updated        2016-08-29
// ==/UserScript==

(function () {
    var path = document.location.pathname
                .replace(/\/Timesheet\//, '')
                .replace(/\.aspx.*/, '');

    /**
     * Searches for matching elements
     * Array version of `querySelectorAll` but as an array
     * @param   {String}  selector  CSS-style selector
     * @param   {Element}  node     Optional element to search within
     * @return  {Array}             Array of matched elements
     */
    var query = function (selector, node) {
            node = node || document;

            return Array.prototype.slice.call(node.querySelectorAll(selector));
        };

    /**
     * Storage API (proxy for `localStorage`)
     * @type  {Object}
     */
    var storage = {
            /**
             * Retrieve a value from storage
             * @param   {String}  key  Key name
             * @return  {Object}       Value, converted from a string
             */
            get: function (key) {
                var value = localStorage.getItem(key),
                    convertedValue;

                if (typeof value === 'string') {
                    try {
                        convertedValue = JSON.parse(value);
                    } catch(e) {
                        convertedValue = value;
                    }
                }
                else {
                    convertedValue = value;
                }

                return convertedValue;
            },

            /**
             * Stores a value
             * @param  {String}  key    Key name
             * @param  {Mixed}  value   Value, must be a string or a JSON-friendly object
             */
            set: function (key, value) {
                if (typeof value !== 'string') {
                    value = JSON.stringify(value);
                }

                return localStorage.setItem(key, value);
            }
        };

    // https://oftlats.cma.com/Timesheet/MyTimesheet.aspx?from=8
    // https://time01.lats.ny.gov/Timesheet/MyTimesheet.aspx?from=8

    /////////////////////////
    // Timesheet Auto-fill //
    /////////////////////////

    /**
     * Timesheet module
     */
    var Timesheet = function Timesheet () {
        // Days:       R  F  M  T  W  R  F   M   T   W
        var dayNums = [0, 1, 4, 5, 6, 7, 8, 11, 12, 13];
        var periods = {
                MorningIn: {
                    label: 'Day in:',
                    val: '',
                    // ,alternates: ['4|7:30AM','11|7:30AM'] // Mondays
                },
                LunchOut: {
                    label: 'Lunch begin:',
                    val: '12:00PM'
                    // ,alternates: ['4|11:30AM','11|11:30AM']
                },
                LunchIn: {
                    label: 'Lunch end:',
                    val: '12:30PM'
                    // ,alternates: ['4|12:00PM','11|12:00PM']
                },
                NightOut: {
                    label: 'Day out:',
                    val: ''
                    // ,alternates: ['4|3:30PM','11|3:30PM']
                }
            };
        var timeSheetSettings = {
                onlyBlankDays: true
            };
        // Simple proxy for the storage proxy
        var store = {
                save: function (val) {
                    return storage.set('timeSheetSettings', val);
                },
                retrieve: function () {
                    return storage.get('timeSheetSettings');
                }
            };
        var checked = {
            yes: '&#10003;',
            no: '&#128683;',
        };
        var globalControlWrapper;
        var button;
        var fixerPopover;
        var dataStore = {};
        var leaveBalances = {};

        /**
         * Initalize module and UI
         */
        function init () {
            var storedSettings = store.retrieve();
            var i;
            var label;
            var input;
            var flagWrapper;
            var buttonWrapper;
            var closeButton;
            var newRow;
            var insertBeforeRow;

            // Make sure it's not an approval screen
            if (document.getElementById('ctl00_ContentPlaceHolder1_btnApprove')) {
                return;
            }

            // Add CSS
            setupStyles();

            // Make sure element exists
            createPopover();

            // Add new row to contain autofill buttons for each day
            newRow = document.createElement('tr');
            insertBeforeRow = document.querySelector('#ctl00_ContentPlaceHolder1_TimesheetGridTable > tbody > tr:nth-child(34)');

            if (insertBeforeRow) {
                insertBeforeRow.parentNode.insertBefore(newRow, insertBeforeRow);
            }

            // // Create data store
            // ['header', 0, 1, 'filler', 'filler', 4, 5, 6, 7, 8, 'filler', 'filler', 11, 12, 13, 'filler'].forEach(function (index) {
            //     var dayObj = {
            //             index: index,
            //             control: null,
            //             difference: 0,
            //         };
            //     var newCell = document.createElement('td');

            //     // Weekends -- just add a dummy cell
            //     if (index === 'filler') {
            //         newCell.innerHTML = '&nbsp;';
            //         newRow.appendChild(newCell);

            //         return false;
            //     }
            //     else if (index === 'header') {
            //         newCell.innerHTML = 'Auto Fixer';
            //         newCell.style.fontSize = '11px';
            //         newCell.style.textAlign = 'center';
            //         newRow.appendChild(newCell);

            //         return false;
            //     }

            //     dayObj.MorningIn = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataMorningInDArr' + index),
            //     };
            //     dayObj.MorningIn.value = dayObj.MorningIn.elem.value.trim();
            //     dayObj.MorningIn.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.LunchOut = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataLunchOutDArr' + index),
            //     };
            //     dayObj.LunchOut.value = dayObj.LunchOut.elem.value.trim();
            //     dayObj.LunchOut.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.LunchIn = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataLunchInDArr' + index),
            //     };
            //     dayObj.LunchIn.value = dayObj.LunchIn.elem.value.trim();
            //     dayObj.LunchIn.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.NightOut = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataNightOutDArr' + index),
            //     };
            //     dayObj.NightOut.value = dayObj.NightOut.elem.value.trim();
            //     dayObj.NightOut.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.OTMeal = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataOTMealDArr' + index),
            //     };
            //     dayObj.OTMeal.value = dayObj.OTMeal.elem.value.trim();
            //     dayObj.OTMeal.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.Vacation = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataVacationDArr' + index),
            //     };
            //     dayObj.Vacation.value = dayObj.Vacation.elem.value.trim();
            //     dayObj.Vacation.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.SickRegular = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataSickRegularDArr' + index),
            //     };
            //     dayObj.SickRegular.value = dayObj.SickRegular.elem.value.trim();
            //     dayObj.SickRegular.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.SickFamily = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataSickFamilyDArr' + index),
            //     };
            //     dayObj.SickFamily.value = dayObj.SickFamily.elem.value.trim();
            //     dayObj.SickFamily.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.Personal = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataPersonalDArr' + index),
            //     };
            //     dayObj.Personal.value = dayObj.Personal.elem.value.trim();
            //     dayObj.Personal.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.CompCharged = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataCompChargedDArr' + index),
            //     };
            //     dayObj.CompCharged.value = dayObj.CompCharged.elem.value.trim();
            //     dayObj.CompCharged.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.HolidayRegular = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataHolidayRegularDArr' + index),
            //     };
            //     dayObj.HolidayRegular.value = dayObj.HolidayRegular.elem.value.trim();
            //     dayObj.HolidayRegular.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.Floater = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataFloaterDArr' + index),
            //     };
            //     dayObj.Floater.value = dayObj.Floater.elem.value.trim();
            //     dayObj.Floater.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.VRWSUsed = {
            //         elem: document.getElementById('ctl00_ContentPlaceHolder1_TSDataVRWSUsedDArr' + index),
            //     };
            //     dayObj.VRWSUsed.value = dayObj.VRWSUsed.elem.value.trim();
            //     dayObj.VRWSUsed.elem.addEventListener('keyup', onTimeInputKeyup);

            //     dayObj.timeWorked = {
            //         elem: document.querySelector('#ctl00_ContentPlaceHolder1_TimesheetGridTable > tbody > tr:nth-child(32) > td:nth-child(' + (index + 2) + ')'),
            //     };
            //     dayObj.timeWorked.value = dayObj.timeWorked.elem.innerHTML.trim();

            //     dayObj.charges = {
            //         elem: document.querySelector('#ctl00_ContentPlaceHolder1_TimesheetGridTable > tbody > tr:nth-child(33) > td:nth-child(' + (index + 2) + ')'),
            //     };
            //     dayObj.charges.value = dayObj.charges.elem.innerHTML.trim();

            //     dayObj.totalTime = {
            //         elem: document.querySelector('#ctl00_ContentPlaceHolder1_TimesheetGridTable > tbody > tr:nth-child(35) > td:nth-child(' + (index + 2) + ')'),
            //     };
            //     dayObj.totalTime.value = dayObj.totalTime.elem.innerHTML.trim();

            //     // Create day-specific autofill control
            //     dayObj.control = document.createElement('div');
            //     dayObj.control.className = 'lats-helper-day-control';
            //     dayObj.control.innerHTML = checked.yes;
            //     dayObj.control.addEventListener('click', function (evt) {
            //         onDayAutofillClick(evt, dayObj);
            //     });
            //     // console.log('control ' + index + ': ', dayObj.control);

            //     // Add elements to the table
            //     newCell.appendChild(dayObj.control);
            //     newRow.appendChild(newCell);

            //     // Add to data store
            //     dataStore['day' + index] = dayObj;

            //     // Process current entries
            //     refreshDay(dayObj);
            // });

            // console.info('Data store: ', dataStore);
            // console.table(dataStore);

            ////////////////////
            // Leave balances //
            ////////////////////

            leaveBalances.Vacation = {
                elem: document.querySelector('#ctl00_ContentPlaceHolder1_SysBalances > tbody > tr:nth-child(6) > td:nth-child(2)'),
                displayName: 'Vacation',
            };
            leaveBalances.Vacation.hours = parseFloat(leaveBalances.Vacation.elem.innerHTML);

            leaveBalances.SickRegular = {
                elem: document.querySelector('#ctl00_ContentPlaceHolder1_SysBalances > tbody > tr:nth-child(6) > td:nth-child(3)'),
                displayName: 'Sick',
            };
            leaveBalances.SickRegular.hours = parseFloat(leaveBalances.SickRegular.elem.innerHTML);

            leaveBalances.Personal = {
                elem: document.querySelector('#ctl00_ContentPlaceHolder1_SysBalances > tbody > tr:nth-child(6) > td:nth-child(4)'),
                displayName: 'Personal',
            };
            leaveBalances.Personal.hours = parseFloat(leaveBalances.Personal.elem.innerHTML);

            leaveBalances.CompCharged = {
                elem: document.querySelector('#ctl00_ContentPlaceHolder1_SysBalances > tbody > tr:nth-child(6) > td:nth-child(5)'),
                displayName: 'Non-Comp',
            };
            leaveBalances.CompCharged.hours = parseFloat(leaveBalances.CompCharged.elem.innerHTML);

            leaveBalances.HolidayRegular = {
                elem: document.querySelector('#ctl00_ContentPlaceHolder1_SysBalances > tbody > tr:nth-child(6) > td:nth-child(6)'),
                displayName: 'Holiday',
            };
            leaveBalances.HolidayRegular.hours = parseFloat(leaveBalances.HolidayRegular.elem.innerHTML);

            leaveBalances.Floater = {
                elem: document.querySelector('#ctl00_ContentPlaceHolder1_SysBalances > tbody > tr:nth-child(6) > td:nth-child(7)'),
                displayName: 'Floater',
            };
            leaveBalances.Floater.hours = parseFloat(leaveBalances.Floater.elem.innerHTML);

            // Read stored settings
            if (storedSettings) {
                timeSheetSettings = storedSettings;
            }
            else {
                // Save settings for next time
                // This will also fill in any new options introduced since the user last used the extension
                store.save(timeSheetSettings);
            }

            // Get periods from local store
            getStoredPeriods();

            //////////////////////////////
            // Global autofill controls //
            //////////////////////////////

            // Create container for auto-insert controls
            globalControlWrapper = document.createElement('div');
            globalControlWrapper.className = 'lats-helper-global-controls';
            globalControlWrapper.innerHTML = '<p><strong>Autofill timesheet</strong></p>';
            document.body.appendChild(globalControlWrapper);

            /////////////////
            // Time inputs //
            /////////////////

            // Add inputs
            for (i in periods) {
                if (periods.hasOwnProperty(i)) {
                    label = document.createElement('label');
                    label.setAttribute('for', i);
                    label.setAttribute('tabindex', '1');
                    label.innerHTML = periods[i].label;
                    label.style.cssText = 'display: inline-block;' +
                                          'width: 90px;' +
                                          'height: 22px;';
                    globalControlWrapper.appendChild(label);

                    input = document.createElement('input');
                    input.type = 'text';
                    input.id = i;
                    input.setAttribute('tabindex', '1');
                    input.style.borderWidth = '1px';
                    input.style.borderStyle = 'solid';

                    if (periods[i].val) {
                        input.value = periods[i].val;
                    }

                    input.addEventListener('keyup', onPeriodKeyup);
                    input.addEventListener('blur', onPeriodBlur);
                    globalControlWrapper.appendChild(input);

                    globalControlWrapper.appendChild(document.createElement('br'));
                }
            }

            ///////////
            // Flags //
            ///////////

            // Flags wrapper
            flagWrapper = document.createElement('div');
            flagWrapper.style.cssText = 'margin: 10px auto 0 auto;' +
                                        'overflow: hidden';
            globalControlWrapper.appendChild(flagWrapper);

            // "Only bank days" flag, check box
            input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'onlyBlankDays';
            input.addEventListener('change', onOnlyBlankDaysClick);
            input.setAttribute('tabindex', '1');
            input.style.cssText = 'float: left;' +
                                  'color: #fff;' +
                                  'border-color: #4cae4c;';

            // Set check box checked state
            if (timeSheetSettings.onlyBlankDays) {
                input.setAttribute('checked', 'checked');
            }

            flagWrapper.appendChild(input);

            // "Only bank days" flag, label
            label = document.createElement('label');
            label.setAttribute('for', 'onlyBlankDays');
            label.setAttribute('tabindex', '1');
            label.innerHTML = 'Only fill in days with no entries';
            label.style.cssText = 'display: inline-block;' +
                                  'font-size: 12px;' +
                                  'width: 200px;' +
                                  'height: 22px;';
            flagWrapper.appendChild(label);

            /////////////
            // Buttons //
            /////////////

            // Button wrapper
            buttonWrapper = document.createElement('div');
            buttonWrapper.style.cssText = 'margin: 10px auto 0 auto;' +
                                          'overflow: hidden';
            globalControlWrapper.appendChild(buttonWrapper);

            // Apply button
            button = document.createElement('button');
            button.type = 'button';
            button.innerHTML = 'Apply';
            button.addEventListener('click', onButtonClick);
            button.setAttribute('tabindex', '1');
            button.style.cssText = 'float: left;' +
                                   'color: #fff;' +
                                   'background-color: #5cb85c;' +
                                   'border-color: #4cae4c;';
            buttonWrapper.appendChild(button);

            // Add button
            closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.innerHTML = 'Close';
            closeButton.addEventListener('click', onCloseButtonClick);
            closeButton.setAttribute('tabindex', '1');
            closeButton.style.cssText = 'float: right;';
            buttonWrapper.appendChild(closeButton);

            // Make all input fields updateable (normally, future dates are readonly)
            query('#ctl00_ContentPlaceHolder1_TimesheetGridTable input[readonly="readonly"][type="text"]')
                .forEach(function (input) {
                    input.removeAttribute('readonly');
                });

            // Un-disable submit buttons (namely "Save")
            query('input[type="submit"][disabled]')
                .forEach(function (input) {
                    input.removeAttribute('disabled');
                });
        }

        function onDayAutofillClick (evt, dayObj) {
            // console.log('[onDayAutofillClick] clicked on day: ', dayObj);
            var close = document.createElement('button');
            var absDifference;

            evt.preventDefault();

            // Already open
            if (fixerPopover.style.display === 'block') {
                // console.warn('already open');
                return true;
            }
            // console.log('fixerPopover.style.display = ' + fixerPopover.style.display);

            // Create popover contents based on the time difference:

            // Not enough time worked
            if (dayObj.difference > 0) {
                fixerPopover.innerHTML = '<p>Charge time from:</p>';

                // Enumerate over the various leave categories and add buttons for each one that has hours to spare
                Object.keys(leaveBalances).forEach(function (type) {
                    var obj = leaveBalances[type];
                    var para;
                    var button;

                    if (obj.hours > 0 && obj.hours >= dayObj.difference) {
                        button = document.createElement('button');
                        button.setAttribute('type', 'button');
                        button.innerHTML = obj.displayName;

                        button.addEventListener('click', function (evt) {
                            // console.log('button click ', evt);
                            var elem = dayObj[type].elem;
                            var currValue = parseFloat(elem.value);
                            var currLeaveValue = parseFloat(obj.elem.innerHTML);

                            // Update value in the table
                            elem.value = (currValue + dayObj.difference);

                            // Update leave balance
                            obj.elem.innerHTML = (currLeaveValue - dayObj.difference);

                            closePopover();
                            refreshDay(dayObj);
                        }, false);

                        para = document.createElement('p');
                        para.appendChild(button);
                        para.appendChild(document.createTextNode(' (' + obj.hours + ' hours available)'));
                        fixerPopover.appendChild(para);
                    }
                });
            }
            // Too much time worked
            else if (dayObj.difference < 0) {
                var didAddAButton = false;

                absDifference = Math.abs(dayObj.difference);

                fixerPopover.innerHTML = '<p>You\'ve entered an extra ' + absDifference + ' hours (worked + charges).</p>';

                // Enumerate over the various leave categories and add buttons for each one that has hours to spare
                ['OTMeal', 'Vacation', 'SickRegular', 'SickFamily', 'Personal', 'CompCharged', 'HolidayRegular', 'Floater', 'VRWSUsed'].forEach(function (type) {
                    var obj = dayObj[type];
                    var para;
                    var button;

                    if (obj.value > 0) {
                        button = document.createElement('button');
                        didAddAButton = true;

                        button.setAttribute('type', 'button');
                        button.innerHTML = 'Subtract from ' + type;

                        button.addEventListener('click', function (evt) {
                            var currValue = parseFloat(obj.value);

                            // Update value in the table
                            if (currValue - absDifference < 0) {
                                // Not enough time in this category to make up for the whole difference, so just set it to zero
                                obj.elem.value = 0;

                                // Update leave balance
                                obj.elem.innerHTML = (currValue + parseFloat(obj.elem.value));
                            }
                            else {
                                // Not enough time in this category to make up for the whole difference, so just set it to zero
                                obj.elem.value = (currValue - absDifference);

                                // Update leave balance
                                obj.elem.innerHTML = (currValue + obj.elem.value);
                            }

                            closePopover();
                            refreshDay(dayObj);
                        }, false);

                        para = document.createElement('p');
                        para.appendChild(button);
                        fixerPopover.appendChild(para);
                    }
                });

                // Add an explanatory message if we didn't add any useful buttons
                if (!didAddAButton) {
                    fixerPopover.innerHTML += '<p>Be sure to adjust your time.</p>';
                }
            }
            else {
                fixerPopover.innerHTML = '<p>Everything adds up! You don\'t need to change anything.</p>';
            }

            // Open popover
            fixerPopover.style.display = 'block';
            fixerPopover.style.top = (dayObj.control.getBoundingClientRect().top + dayObj.control.clientHeight + document.body.scrollTop + 4) + 'px';
            fixerPopover.style.left = dayObj.control.getBoundingClientRect().left + 'px';

            // Close button
            close.setAttribute('type', 'button');
            close.innerHTML = 'Close';
            close.style.cssText = 'display: block;' +
                                  'margin: 2em auto 0 auto;';
            close.addEventListener('click', closePopover, false);
            fixerPopover.appendChild(close);
            // console.log('popover is ready and open: ', fixerPopover);

            setTimeout(function () { // Ugh, trying to avoid having this triggered by the click that called this very function
                document.body.addEventListener('click', onBodyClick, false);
            }, 100);
        }

        // Close the popover when clicking away from it
        function onBodyClick (evt) {
            // Clicked outside of a popover
            if (!$(evt.target).closest('.lats-helper-day-popover').length) {
                closePopover();

                document.body.removeEventListener('click', onBodyClick);
            }
        }

        // Close the popover when clicking away from it
        function createPopover () {
            if (!fixerPopover) {
                fixerPopover = document.createElement('div');
                fixerPopover.className = 'lats-helper-day-popover';
                fixerPopover.style.display = 'none';

                // Add popover to page
                document.body.appendChild(fixerPopover);
            }
        }

        // Adds styles for the classes used in this module
        function setupStyles () {
            /////////////////////////////////////////////////
            // Fixer controls at the bottom of each column //
            /////////////////////////////////////////////////

            // Basic style
            addStyle(
                '.lats-helper-day-control {' +
                    'text-align: center;' +
                    'cursor: default;' +
                    'border-radius: 3px;' +
                '}'
            );

            // Too little time
            addStyle(
                '.lats-helper-day-control.lats-helper-under {' +
                    'background-color: pink;' +
                    'color: #000000;' +
                    'cursor: pointer;' +
                    'border: 1px solid #930;' +
                '}'
            );

            // Too much time
            addStyle(
                '.lats-helper-day-control.lats-helper-over {' +
                    'background-color: yellow;' +
                    'color: #000000;' +
                    'cursor: default;' +
                '}'
            );

            // Even Steven
            addStyle(
                '.lats-helper-day-control.lats-helper-even {' +
                    'background-color: #FFFFFF;' +
                    'color: #009900;' +
                    'cursor: default;' +
                '}'
            );

            ///////////////////
            // Fixer popover //
            ///////////////////

            // Default
            addStyle(
                '.lats-helper-day-popover {' +
                    'position: absolute;' +
                    'top: 0px;' +
                    'left: 0px;' +
                    'min-width: 200px;' +
                    'min-height: 100px;' +
                    'padding: 10px;' +
                    'border: 1px solid #444;' +
                    'box-shadow: 0 0 2px #444;' +
                    'background-color: white;' +
                    'border-radius: 3px;' +
                    'z-index: 100;' +
                '}'
            );

            // // Too little time
            // addStyle(
            //     '.lats-helper-day-popover.lats-helper-under {' +
            //         'max-width: 300px;' +
            //     '}'
            // );

            // Too much time
            addStyle(
                '.lats-helper-day-popover.lats-helper-over {' +
                    'max-width: 200px;' +
                '}'
            );

            // Even Steven
            addStyle(
                '.lats-helper-day-popover.lats-helper-even {' +
                    'max-width: 200px;' +
                '}'
            );

            //////////////////////////////////////////////
            // Global controls at the top of the window //
            //////////////////////////////////////////////

            addStyle(
                '.lats-helper-global-controls {' +
                    'position: absolute;' +
                    'top: 10px;' +
                    'right: 10px;' +
                    'padding: 10px;' +
                    'background: white;' +
                    'width: 270px;' +
                    'border: 1px solid #555;' +
                    'box-shadow: 1px 1px 4px #555;' +
                '}'
            );
        }

        // Close the popover when clicking away from it
        function closePopover () {
            fixerPopover.style.display = 'none';
        }

        function onTimeInputKeyup (evt) {
            var target = evt.target;
            var fullId = target.id;
            var pieces = /ctl00_ContentPlaceHolder1_TSData(\w+)DArr(\d+)/.exec(fullId);
            var fieldName = pieces[1];
            var dayIndex = pieces[2];
            var dayObj;

            // Ignore arrow keys
            if (evt.keyCode >= 37 && evt.keyCode <= 40) {
                return true;
            }

            // Ignore tab, enter, and escape keys
            if (evt.keyCode === 9 || evt.keyCode === 13 || evt.keyCode === 27) {
                return true;
            }

            // Update data store
            dayObj = dataStore['day' + dayIndex];
            // console.log('Day ' + dayIndex + ', ' + fieldName + ' changed from ' + dayObj[fieldName].value + ' to ' + target.value, dayObj);
            dayObj[fieldName].value = target.value;

            // refreshDay(dayObj);
        }

        function refreshDay (dayObj) {
            var reportedTimeWorked = 0;
            var charges;
            var totalTime;

            // All four times recorded
            if (dayObj.MorningIn.value && dayObj.LunchOut.value && dayObj.LunchIn.value && dayObj.NightOut.value) {
                // First half of the day
                reportedTimeWorked += (new Date('01/01/2016 ' + dayObj.LunchOut.value).getTime() - new Date('01/01/2016 ' + dayObj.MorningIn.value).getTime());

                // Second half of the day
                reportedTimeWorked += (new Date('01/01/2016 ' + dayObj.NightOut.value).getTime() - new Date('01/01/2016 ' + dayObj.LunchIn.value).getTime());

                // Convert to seconds
                reportedTimeWorked = reportedTimeWorked / 1000;

                // Convert to hours
                reportedTimeWorked = reportedTimeWorked / 3600;
            }

            // Something wasn't filled in completely, so quit silently
            if (isNaN(reportedTimeWorked)) {
                return true;
            }
            // console.log('[refreshDay] Worked so far on Day ' + dayObj.index + ': ' + reportedTimeWorked + ' hours');

            // Update view
            dayObj.timeWorked.elem.innerHTML = reportedTimeWorked;

            if (reportedTimeWorked % 0.10 === 0) {
                dayObj.timeWorked.elem.innerHTML += 0;
            }

            // Compare to total and charges
            charges = parseFloat(dayObj.charges.elem.innerHTML);
            totalTime = parseFloat(dayObj.totalTime.elem.innerHTML);

            dayObj.difference = totalTime - reportedTimeWorked - charges;

            // Too much time worked
            if (charges + reportedTimeWorked > totalTime) {
                // Set title text
                dayObj.totalTime.elem.setAttribute('title', 'Too much time. Subtract ' + Math.abs(dayObj.difference) + ' hours from your charges and/or time worked');
                dayObj.control.setAttribute('title', 'Too much time. Subtract ' + Math.abs(dayObj.difference) + ' hours from your charges and/or time worked');

                // Update control's content and style
                dayObj.control.innerHTML = checked.no;
                dayObj.control.classList.add('lats-helper-over');
                dayObj.control.classList.remove('lats-helper-under');
                dayObj.control.classList.remove('lats-helper-even');

                fixerPopover.classList.add('lats-helper-over');
                fixerPopover.classList.remove('lats-helper-under');
                fixerPopover.classList.remove('lats-helper-even');
            }
            // Not enough time worked
            else if (charges + reportedTimeWorked < totalTime) {
                // Set title text
                dayObj.totalTime.elem.setAttribute('title', 'Not enough time. Add ' + dayObj.difference + ' hours to your charges and/or time worked');
                dayObj.control.setAttribute('title', 'Not enough time. Add ' + dayObj.difference + ' hours to your charges and/or time worked');

                // Update control's content and style
                dayObj.control.innerHTML = checked.no;
                dayObj.control.classList.add('lats-helper-under');
                dayObj.control.classList.remove('lats-helper-over');
                dayObj.control.classList.remove('lats-helper-even');

                fixerPopover.classList.add('lats-helper-under');
                fixerPopover.classList.remove('lats-helper-over');
                fixerPopover.classList.remove('lats-helper-even');
            }
            // Even Steven
            else {
                // Set title text
                dayObj.totalTime.elem.setAttribute('title', 'Everything adds up!');
                dayObj.control.setAttribute('title', 'Everything adds up!');

                // Update control's content and style
                dayObj.control.innerHTML = checked.yes;
                dayObj.control.classList.add('lats-helper-even');
                dayObj.control.classList.remove('lats-helper-over');
                dayObj.control.classList.remove('lats-helper-under');

                fixerPopover.classList.add('lats-helper-even');
                fixerPopover.classList.remove('lats-helper-over');
                fixerPopover.classList.remove('lats-helper-under');
            }

            // Update data store with new `difference`
            dataStore['day' + dayObj.index] = dayObj;
        }

        // Teardown UI
        function onCloseButtonClick(/* evt */) {
            // Remove the UI
            globalControlWrapper.parentNode.removeChild(globalControlWrapper);
        }

        function getStoredPeriods(/* storedPeriods */) {
            var local = storage.get('periods');

            // Update cache with stored value
            if (local && typeof local === 'object' && local.hasOwnProperty('MorningIn')) {
                periods = local;
            }
            // Nothing valid was stored yet, so add the default
            else {
                storage.set('periods', periods);
            }
        }

        // Store the value as it's typed
        function onPeriodKeyup(evt) {
            var input = evt.target;
            var id = input.id;
            var val = formatTime(input.value);

            if (val) {
                // Store the value if it's valid
                changePeriod(id, val);
                input.style.borderColor = 'green';
            }
            else {
                // Let the user know the value is not (yet) in a valid format
                input.style.borderColor = 'maroon';
            }
        }

        // Format the value
        function onPeriodBlur (evt) {
            var input = evt.target;
            var id = input.id;
            var val = formatTime(input.value);

            if (val) {
                // Format the input field
                input.style.borderColor = 'green';

                // Store the value
                changePeriod(id, val);
            }
            else {
                input.style.borderColor = 'maroon';
            }
        }

        function formatTime (val) {
            var hhmmPattern = /^(\d+)\:(\d\d)\s*(\w+)?$/; // HH:MM
            var noColonPattern = /^(\d{3,4})\s*(\w+)?$/;  // HMM or HMM
            var shorthandPattern = /^(\d{1,2})\s*([ap])?m?$/; // HHpm (which equates to HH:00 PM)
            var parts;
            var hour;
            var hourNum;
            var minute;
            var suffix;

            val = val.trim();

            // Hp shorthand format
            if (shorthandPattern.test(val)) {
                parts = shorthandPattern.exec(val);
                hour = parts[1];
                minute = '00';

                if (parts[2]) {
                    suffix = parts[2];
                }
            }
            // HH:MM format
            else if (hhmmPattern.test(val)) {
                parts = hhmmPattern.exec(val);
                hour = parts[1];
                minute = parts[2];

                if (parts[3]) {
                    suffix = parts[3];
                }
            }
            // HHMM format (no colon)
            else if (noColonPattern.test(val)) {
                parts = noColonPattern.exec(val);

                if (parts[2]) {
                    suffix = parts[2];
                }

                // Create an array of the three or four digits
                parts = parts[1].split('');

                // We don't know if the user had one or two digits for the hour, but the minute must be the last two digits
                minute = parts.pop();
                minute = parts.pop() + minute;

                // What's left is the hour
                hour = parts.join('');
            }
            else {
                // We have nothing to go by, so just quit
                return '';
            }

            // Normalize prefix
            if (suffix) {
                if (/^p/i.test(suffix)) {
                    suffix = 'PM';
                }
                else if (/^a/i.test(suffix)) {
                    suffix = 'AM';
                }
                else {
                    suffix = '';
                }
            }

            // Use the hours to guess the suffix
            if (!suffix) {
                hourNum = parseInt(hour, 10);

                if (hourNum < 6 || hourNum === 12) {
                    suffix = 'PM';
                }
                else if (!isNaN(hourNum)) {
                    suffix = 'AM';
                }
            }

            // Make sure we have everything
            if (hour && minute && suffix) {
                return hour + ':' + minute + suffix;
            }
            else {
                return '';
            }
        }

        function changePeriod (id, val) {
            if (periods.hasOwnProperty(id) && val) {
                periods[id].val = val;

                storage.set('periods', periods);
            }
        }

        function onButtonClick ( /* evt */ ) {
            fillInValues();
        }

        function onOnlyBlankDaysClick (evt) {
            // Update setting
            timeSheetSettings.onlyBlankDays = evt.target.checked;
            store.save(timeSheetSettings);
        }

        // Populate the fields on the page
        function fillInValues () {
            var i;
            var j;
            var id;
            var val;

            i = dayNums.length;
            while (i--) {
                // Make sure the day is completely empty so we don't overwrite any user-entered values
                if (timeSheetSettings.onlyBlankDays && !isDayBlank(dayNums[i])) {
                    continue;
                }

                // Loop through stored values
                for (j in periods) {
                    // val = '';
                    //
                    // if (periods[j].alternates) {
                    //     k = periods[j].alternates.length;
                    //
                    //     while (k--) {
                    //         alt = periods[j].alternates[k].split('|');
                    //
                    //         if (parseInt(alt[0], 10) === dayNums[i]) {
                    //             val = alt[1];
                    //             break;
                    //         }
                    //     }
                    // }
                    //
                    // If `val` wasn't populated by an alternate
                    // if (!val) {
                        val = periods[j].val;
                    // }

                    // Make sure we have a value (i.e. field wasn't blank)
                    if (val) {
                        id = 'ctl00_ContentPlaceHolder1_TSData' + j + 'DArr' + dayNums[i];

                        // Apply value
                        try {
                            document.getElementById(id).value = val;
                        } catch (e) { }
                    }
                }
            }
        }

        // Determines if a day has no time filled in yet
        function isDayBlank(day) {
            var numEmpty = 0;
            // var dayNum = dayNums[day]; // Suffix of the element ID
            var id;
            var j;

            // Loop through stored values
            for (j in periods) {
                id = 'ctl00_ContentPlaceHolder1_TSData' + j + 'DArr' + day;

                // Check for a value
                if (document.getElementById(id).value.trim().length) {
                    numEmpty++;
                }
            }

            return numEmpty === 0;
        }

        // Run the module
        init();
    }; // end Timesheet

    ///////////////////////
    // Sub Task Selector //
    ///////////////////////

    /**
     * SubTasks module
     */
    var SubTasks = function SubTasks () {
        var subTaskDropdown = document.querySelector('select[title="Sub Tasks"]');
        var subTaskOptions = [].slice.call(subTaskDropdown.options);
        var insertionPoint = document.querySelector('.inputTable'); // This is the gray area in the UI; put new elements directly after this
        var controls = document.createElement('div');
        var searchLabel = document.createElement('label');
        var searchBox = document.createElement('input');
        var clusterLabel = document.createElement('label');
        var clusterMenu = document.createElement('select');
        var agencyMenu = document.createElement('select');
        var agencyLabel = document.createElement('label');
        var clearButton = document.createElement('button');
        var hasUIbeenRendered = false;
        var items = [];
        var list;
        var subTaskSettings = {
                cluster: '',
                agency: ''
            };

        // Simple proxy for the storage proxy
        var store = {
                save: function (val) {
                    return storage.set('subTaskSettings', val);
                },
                retrieve: function () {
                    return storage.get('subTaskSettings');
                }
            };

        // List of clusters and their agencies
        var clusters = [];

        /**
         * Initializes module and the UI
         */
        function init () {
            var storedSettings;

            // Check if a task was just added
            if (document.querySelectorAll('#ctl00_ContentPlaceHolder1_UpdatePanel2, [name="ctl00$ContentPlaceHolder1$btnClose"]').length > 1 && document.getElementById('ctl00_ContentPlaceHolder1_UpdatePanel2').innerHTML.indexOf('Sub Task was successfully added.') !== -1) {
                // Auto-close popup
                document.querySelector('[name="ctl00$ContentPlaceHolder1$btnClose"]').click();

                // Don't do any more costly rendering since the popup will now close
                return true;
            }

            clusters = parseClusterAndAgencyLists();

            // Read stored settings
            storedSettings = store.retrieve();

            if (storedSettings) {
                subTaskSettings = storedSettings;
            }
            else {
                // Save default settings for next time
                // This will also fill in any new options introduced since the user last used the extension
                store.save(subTaskSettings);
            }

            // Draw the UI
            renderUI();
        }

        function renderUI () {
            // List of tasks rendered by LATS
            subTaskDropdown = document.querySelector('select[title="Sub Tasks"]');

            // Don't re-rendering these elements if we're just re-creating the task list
            if (!hasUIbeenRendered) {
                // Container for controls
                controls.style.cssText = 'padding: 10px;';
                insertionPoint.parentNode.insertBefore(controls, insertionPoint.nextSibling);

                // Search
                searchLabel.innerHTML = 'Filter:';
                searchLabel.style.cssText = 'display: inline-block; padding-right: 5px;';
                searchLabel.setAttribute('for', 'searchBox');

                searchBox.type = 'text';
                searchBox.id = 'searchBox';
                searchBox.style.cssText = 'display: inline-block; margin-right: 10px;';
                searchBox.setAttribute('tabindex', '1');
                searchBox.addEventListener('keyup', onSearchKeyup, false);

                controls.parentNode.insertBefore(searchLabel, controls.nextSibling);
                controls.parentNode.insertBefore(searchBox, searchLabel.nextSibling);

                ////////////////////////
                // Cluster and agency //
                ////////////////////////

                // Create elements
                clusterLabel.innerHTML = 'Cluster:';
                clusterLabel.setAttribute('for', 'clusterMenu');

                clusterMenu.id = 'clusterMenu';
                clusterMenu.setAttribute('tabindex', '1');

                agencyLabel.innerHTML = 'Agency:';
                agencyLabel.setAttribute('for', 'agencyMenu');
                agencyLabel.style.cssText = 'display: inline-block; padding-left: 10px;';

                agencyMenu.id = 'agencyMenu';
                agencyMenu.setAttribute('tabindex', '1');

                buildDropdowns(subTaskSettings.cluster, subTaskSettings.agency);

                // Events
                clusterMenu.addEventListener('change', onDropdownChange, false);
                agencyMenu.addEventListener('change', onDropdownChange, false);

                // Clear button
                clearButton.innerHTML = 'Clear';
                clearButton.setAttribute('type', 'button');
                clearButton.setAttribute('tabindex', '1');
                clearButton.style.cssText = 'margin-left: 10px;';
                clearButton.addEventListener('click', clearFilters, false);

                // Add elements to the page
                searchBox.parentNode.insertBefore(clusterLabel, searchBox.nextSibling);
                searchBox.parentNode.insertBefore(clusterMenu, clusterLabel.nextSibling);
                searchBox.parentNode.insertBefore(agencyLabel, clusterMenu.nextSibling);
                searchBox.parentNode.insertBefore(agencyMenu, agencyLabel.nextSibling);
                searchBox.parentNode.insertBefore(clearButton, agencyMenu.nextSibling);

                // Watch for changes to the task dropdown (i.e. from user search)
                document.getElementById('ctl00_ContentPlaceHolder1_btnSearch').addEventListener('click', function (evt) {
                    // Wait for the dropdown to be populated
                    setTimeout(function () {
                        // Dropdown still isn't populated, wait a little longer
                        if (!subTaskDropdown.options.length) {
                            setTimeout(function () {
                                refreshTaskList();
                            }, 500);
                        }
                        // Dropdown is populated, so refresh the list now
                        else {
                            refreshTaskList();
                        }
                    }, 500);
                }, false);
            }

            createTaskList();

            hasUIbeenRendered = true;
        }

        // Updates the task list when a new set of results is available (i.e. after a user search)
        function refreshTaskList () {
            clusters = parseClusterAndAgencyLists();

            if (!subTaskDropdown) {
                subTaskDropdown = document.querySelector('select[title="Sub Tasks"]');
            }

            subTaskOptions = [].slice.call(subTaskDropdown.options);

            recreateTaskList();
        }

        function parseClusterAndAgencyLists () {
            var store = [];
            var pattern = /([A-Z]{3})_([A-Z]{3})_/;

            subTaskOptions.forEach(function (opt) {
                var text = opt.getAttribute('title');
                var pieces;
                var clusterName;
                var agencyName;
                var clusterIndex;
                var clusterObj;

                if (!pattern.test(text)) {
                    return false;
                }

                // Extract cluster and agency names
                pieces = pattern.exec(text);
                clusterName = pieces[1];
                agencyName = pieces[2];

                // Check if we've already stored this cluster
                clusterIndex = getArrayIndexByProp(store, clusterName, 'name');

                // Hasn't been added yet
                if (clusterIndex === -1) {
                    // Create a new object and store it
                    clusterObj = {
                        name: clusterName,
                        agencies: [agencyName],
                    };

                    store.push(clusterObj);
                }
                // Already exists, just check the agency name
                else {
                    clusterObj = store[clusterIndex];

                    if (clusterObj.agencies.indexOf(agencyName) === -1) {
                        // Add this agency
                        clusterObj.agencies.push(agencyName);

                        // Sort agency list alphabetically
                        clusterObj.agencies.sort();
                    }
                }
            });

            // Sort by cluster, alphabetically
            store.sort(function (a, b) {
                if (a.name < b.name) {
                    return -1;
                }
                else if (a.name > b.name) {
                    return 1;
                }
                else {
                    return 0;
                }
            });

            return store;
        }

        /**
         * Handles clicks on a task item
         * @param   {Event}  evt  Click event
         */
        function onItemClick (evt) {
            var item = evt.target;
            var value = item.getAttribute('data-value');

            // Change dropdown
            subTaskDropdown.value = value;

            // Add the task
            document.querySelector('input[value="Add"]').click();
        }

        /**
         * When the user types a filter/search query
         *
         * @param   {Event}  evt   Keyup event
         */
        function onSearchKeyup (evt) {
            filterBySearchQuery();
        }

        /**
         * Determine the new preferences when either the cluster or agency menus change
         *
         * @param   {Event}  evt   Change event
         */
        function onDropdownChange (evt) {
            var select = evt.target;
            var prefName = select.id.replace(/Menu$/, '');
            var name = select.options[select.selectedIndex].value;
            var found;
            var targetCluster;
            var targetAgency;

            // Update setting
            subTaskSettings[prefName] = name;
            store.save(subTaskSettings);

            // Find new target cluster and target agency

            // A cluster was just chosen
            if (prefName === 'cluster') {
                targetCluster = name;
                targetAgency = subTaskSettings.agency;

                // Make sure the stored agency preference is actually in this cluster
                if (targetAgency) {
                    found = false;

                    clusters.forEach(function (cluster) {
                        if (cluster.name === targetCluster) {
                            // Agency loop
                            cluster.agencies.forEach(function (agency) {
                                if (agency === targetAgency) {
                                    found = true;
                                }
                            });
                        }
                    });

                    if (!found) {
                        // Remove agency preference since it's invalid
                        targetAgency = '';

                        // Update storage
                        subTaskSettings.agency = '';
                        store.save(subTaskSettings);
                    }
                }
            }
            // Agency dropdown was changed
            else if (prefName === 'agency') {
                // An agency was chosen (as opposed to the default "All" option)
                if (name.indexOf('|') !== -1) {
                    found = name.split('|');
                    targetAgency = found[0];
                    targetCluster = found[1];
                }
                // The default "All" option was chosen
                else {
                    // Clear the agency list but keep the current cluster selected
                    targetAgency = '';
                    targetCluster = clusterMenu.options[clusterMenu.selectedIndex].value;
                }
            }

            // Redraw dropdowns
            buildDropdowns(targetCluster, targetAgency);

            // Set parameters to `undefined` if we don't have real values so that the list creation function disregards them
            if (!targetCluster || targetCluster !== '(All)') {
                targetCluster = undefined;
            }
            else {
                subTaskSettings.cluster = (!targetCluster && targetAgency.indexOf('|') !== -1) ? targetAgency.split('|')[0] : targetCluster;
            }

            if (!targetAgency || targetAgency !== '(All)') {
                targetAgency = undefined;
            }
            else {
                subTaskSettings.agency = (targetAgency.indexOf('|') !== -1) ? targetAgency.split('|')[0] : targetAgency;
            }

            // Redraw list
            recreateTaskList(targetCluster, targetAgency);
        }

        /**
         * Builds the cluster and agency dropdowns based on the specified preferences and selects the appropriate option
         *
         * @param   {String}  targetCluster  Optional preferred cluster; if specified, it will be selected and only its agencies will appear in the agency menu
         * @param   {String}  targetAgency   Optional preferred agency; if specified, it will be selected
         *
         * @return  {Boolean}                Success/failure
         */
        function buildDropdowns (targetCluster, targetAgency) {
            var selectedIndices = [-1, -1];
            var agencyList = [];

            // Clear out existing options
            while (clusterMenu.firstChild) {
                clusterMenu.removeChild(clusterMenu.firstChild);
            }

            while (agencyMenu.firstChild) {
                agencyMenu.removeChild(agencyMenu.firstChild);
            }

            // Add blank entries
            clusterMenu.appendChild(new Option('(All)', ''));
            agencyMenu.appendChild(new Option('(All)', ''));

            // Cluster loop
            clusters.forEach(function (cluster, c) {
                var doAddTheseAgencies = false;

                // Add cluster `<option>`
                clusterMenu.appendChild(new Option(cluster.name, cluster.name));

                // If there's a prefered cluster, only add agencies for that cluster
                if (targetCluster) {
                    if (cluster.name === targetCluster) {
                        selectedIndices[0] = c;
                        doAddTheseAgencies = true;
                    }
                }
                // Otherwise add any cluster's agencies
                else {
                    doAddTheseAgencies = true;
                }

                // Collect agency names from all clusters into a single list
                if (doAddTheseAgencies) {
                    cluster.agencies.forEach(function (agency, a) {
                        agencyList.push({
                            label: agency,
                            value: agency,
                            cluster: cluster.name,
                        });
                    });
                }
            });

            // Create agency list
            if (agencyList.length) {
                // Find agencies that are duplicated across clusters and suffix them so the user knows which one they're choosing
                agencyList.forEach(function (agObj, a) {
                    // The agency is listed under more than one cluster
                    if (countInArray(agencyList, agObj.value, 'value') > 1) {
                        // Update the item in the array, adding the cluster as a suffix to the label
                        agencyList[a] = {
                            label: agObj.label + ' (' + agObj.cluster + ')',
                            value: agObj.value,
                            cluster: agObj.cluster,
                        };
                    }
                });

                // Sort agencies by name
                agencyList.sort(function (a, b) {
                    if (a.label > b.label) {
                        return 1;
                    }
                    else if (a.label < b.label) {
                        return -1;
                    }
                    else {
                        return 0;
                    }
                });

                // Add `<option>` for each agency to the menu
                agencyList.forEach(function (agency, a) {
                    if (targetAgency && agency.value === targetAgency) {
                        selectedIndices[1] = a;
                    }

                    agencyMenu.appendChild(new Option(agency.label, agency.value + '|' + agency.cluster));
                });
            }

            // Select the preferred indices (add one to compensate for the dummy option)
            clusterMenu.options[selectedIndices[0] + 1].setAttribute('selected', 'selected');
            agencyMenu.options[selectedIndices[1] + 1].setAttribute('selected', 'selected');

            return true;
        }

        /**
         * Create a spelled-out list of tasks
         */
        function createTaskList (targetCluster, targetAgency) {
            var ignorePattern = /\-Select\-/;
            var matchPattern = null;

            // Clean up and/or extract the agency and cluster names since they could come from different sources and I've built up technical debt by patching this codebase over time without refactoring it for consistency

            // Agency value might be sent as `agency|cluster`
            if (targetAgency && targetAgency.indexOf('|') !== -1) {
                targetCluster = targetAgency; // Make a copy of the whole value before it gets overwritten

                targetCluster = targetCluster.split('|')[1];
                subTaskSettings.cluster = targetCluster;

                targetAgency = targetAgency.split('|')[0];
                subTaskSettings.agency = targetAgency;
            }

            // Cluster is formed as `cluster_agency` (TODO: where is that coming from?)
            if (targetCluster && /\w{3}_\w{3}/.test(targetCluster)) {
                targetCluster = targetCluster.split('_')[0];
                subTaskSettings.cluster = targetCluster;
            }

            if (!targetCluster) {
                targetCluster = subTaskSettings.cluster;
            }

            if (targetAgency && targetAgency.indexOf('|') !== -1) {
                targetAgency = targetAgency.split('|')[0];
                subTaskSettings.agency = targetAgency;
            }

            if (!targetAgency) {
                targetAgency = subTaskSettings.agency;
            }

            // Check for pipe-delimited value coming from storage
            if (targetAgency && targetAgency.indexOf('|') !== -1) {
                targetCluster = targetAgency; // Make a copy of the whole value before it gets overwritten

                targetCluster = targetCluster.split('|')[1];
                subTaskSettings.cluster = targetCluster;

                targetAgency = targetAgency.split('|')[0];
                subTaskSettings.agency = targetAgency;
            }

            // Create prefs patterns for matching
            // Cluster and agency
            if (targetCluster && targetAgency) {
                matchPattern = new RegExp('^' + targetCluster + '_' + targetAgency + '_');
            }
            // Cluster only
            else if (targetCluster && !targetAgency) {
                matchPattern = new RegExp('^' + targetCluster + '_');
            }
            // Agency only
            else if (!targetCluster && targetAgency) {
                // Include wildcard for three-letter cluster
                matchPattern = new RegExp('^\\w{3}_' + targetAgency + '_');
            }

            list = document.createElement('ul');
            list.style.cssText = 'list-style: none outside none;';

            subTaskOptions.forEach(function (opt) {
                var text = opt.getAttribute('title');
                var li;

                if (ignorePattern.test(text)) {
                    return false;
                }

                // Test against user prefs
                if (matchPattern) {
                    if (!matchPattern.test(text)) {
                        return false;
                    }
                    else {
                        //TODO: grey out the cluster/agency portion. It's too confusing to simply strip it because many options begin with some other ABC_ prefix that looks like an agency or cluster code.
                        // text = text.replace(matchPattern, '');
                    }
                }

                li = document.createElement('li');
                li.style.cssText = 'display: block; cursor: pointer;';
                li.innerHTML = text;
                li.setAttribute('data-value', opt.value);
                li.addEventListener('click', onItemClick, false);

                // Add to page
                list.appendChild(li);

                // Cache
                items.push(li);
            });

            insertionPoint.parentNode.appendChild(list);

            // Apply current user-enter filter, if applicable
            if (searchBox.value) {
                filterBySearchQuery();
            }

            searchBox.focus();
        }

        /**
         * Destroy and re-create the list of tasks
         */
        function recreateTaskList (targetCluster, targetAgency) {
            // Empty cache
            items = [];

            // Clear and remove the list if it already exists
            // list.parentNode.removeChild(list);
            if (list && list.parentNode) {
                // Remove `<li>` elements and their event listeners
                (function () {
                    var listItems = list.querySelectorAll('li');
                    var numItems = listItems.length - 1;
                    var listItem;

                    while (numItems > -1) {
                        listItem = listItems[numItems];
                        listItem.removeEventListener('click', onItemClick);

                        // Not sure why this fails
                        if (listItem.parentNode) {
                            listItem.parentNode.removeChild(listItem);
                        }

                        numItems--;
                    }
                }());

                // Remove the `<ul>` element which will be re-created in `createTaskList()`
                list.parentNode.removeChild(list);
            }

            // Re-create list
            createTaskList(targetCluster, targetAgency);
        }

        /**
         * Hide and show tasks based on the user-entered search term
         */
        function filterBySearchQuery () {
            var q = searchBox.value.trim().toLowerCase();
            var pieces = q.split(' ');

            // Hide and show items that match the query
            items.forEach(function (item) {
                var numMatches = 0;

                pieces.forEach(function (piece) {
                    if (item.innerHTML.toLowerCase().indexOf(piece) !== -1) {
                        numMatches++;
                    }
                })

                if (numMatches === pieces.length) {
                    item.style.display = 'block';
                }
                else {
                    item.style.display = 'none';
                }
            });
        }

        /**
         * Clears all filter fields and resets the subtask list
         */
        function clearFilters () {
            // Clear text input
            searchBox.value = '';
            try { searchBox.focus(); } catch (e) { }

            // Reset dropdowns
            clusterMenu.options[0].setAttribute('selected', 'selected');
            clusterMenu.selectedIndex = 0;
            agencyMenu.options[0].setAttribute('selected', 'selected');
            agencyMenu.selectedIndex = 0;

            // Clear stored agency/cluster
            subTaskSettings.cluster = undefined;
            subTaskSettings.agency = undefined;

            // Re-create list
            recreateTaskList();
        }

        // Initialize immediately since this script is being loaded when the document is ready
        init();
    }; // end SubTasks

    /**
     * TDS module
     */
    function TDS () {
        function init() {
            // Increase the table size
            addStyle('#ctl00_ContentPlaceHolder1_pnlTDSData' +
                '{ width: 782px !important; height: auto !important; }');

            // Smaller task names
            addStyle('td[colspan="14"] span' +
                '{ font-size: 12px; font-weight: normal !important; }');

            // Subdued task names
            addStyle(
                '#ctl00_ContentPlaceHolder1_TDSData tr:nth-child(2n+1) {' +
                    'font-weight: normal;' +
                    'font-size: 12px;' +
                '}'
            );

            // Bigger sub-task names
            addStyle('td[colspan="14"] a' +
                '{ display: block; font-size: 16px; font-weight: bold; color: #039; }');

            // Better table colors
            addStyle('tr[style="background-color:#CCCCCC;"]' +
                '{ background-color: #fff !important; }');
            addStyle('tr[style="background-color:#CCCCCC;"] td' +
                '{ border-top: 1px solid #aaa; }');

            // Blank out weekends
            addStyle('#ctl00_ContentPlaceHolder1_TDSData tbody tr td:nth-child(4),' +
                    '#ctl00_ContentPlaceHolder1_TDSData tbody tr td:nth-child(5),' +
                    '#ctl00_ContentPlaceHolder1_TDSData tbody tr td:nth-child(11),' +
                    '#ctl00_ContentPlaceHolder1_TDSData tbody tr td:nth-child(12),' +
                    '#ctl00_ContentPlaceHolder1_HeaderDisplay tbody tr td:nth-child(4),' +
                    '#ctl00_ContentPlaceHolder1_HeaderDisplay tbody tr td:nth-child(5),' +
                    '#ctl00_ContentPlaceHolder1_HeaderDisplay tbody tr td:nth-child(11),' +
                    '#ctl00_ContentPlaceHolder1_HeaderDisplay tbody tr td:nth-child(12),' +
                    '#ctl00_ContentPlaceHolder1_FooterDisplay tbody tr td:nth-child(4),' +
                    '#ctl00_ContentPlaceHolder1_FooterDisplay tbody tr td:nth-child(5),' +
                    '#ctl00_ContentPlaceHolder1_FooterDisplay tbody tr td:nth-child(11),' +
                    '#ctl00_ContentPlaceHolder1_FooterDisplay tbody tr td:nth-child(12)' +
                    '{ opacity: 0.25; }');
        }

        init();
    }

    ///////////////
    // Utilities //
    ///////////////

    // http://stackoverflow.com/a/13389463/348995
    function countInArray (array, value, prop) {
        var count = 0;
        var i;

        for (i = 0; i < array.length; i++) {
            if (array[i][prop] === value) {
                count++;
            }
        }

        return count;
    }

    function getArrayIndexByProp (array, value, prop) {
        return array.map(function (x) { return x[prop]; }).indexOf(value);
    }

    var latsHelperStylesheet;

    /**
     * Add a CSS style to the document
     * @param  {String}  rule  Complete CSS selector and style definition block
     */
    function addStyle (rule) {
        if (!document.styleSheets || typeof rule !== 'string') { return false; }

        // The first time this function is called, a new <style> block must be created
        if (!latsHelperStylesheet) {
            latsHelperStylesheet = document.createElement('style');
            latsHelperStylesheet.type = 'text/css';
            document.documentElement.appendChild(latsHelperStylesheet);
        }

        // Add rules to the style sheet
        latsHelperStylesheet.appendChild(document.createTextNode(' ' + rule));
    }

    //////////////////////////////
    // Immediate initialization //
    //////////////////////////////

    // // Run the appropriate module
    if (path === 'MyTimesheet') {
        Timesheet();
    }
    else if (path === 'SubTasks') {
        SubTasks();
    }
    else if (path === 'TDS') {
        TDS();
    }
}());
