﻿module JustinCredible.SampleApp.Controllers {

    export interface ILogEntryStateParams {
        id: string;
    }

    export class LogEntryController extends BaseController<ViewModels.LogEntryViewModel> {

        public static ID = "LogEntryController";

        public static get $inject(): string[] {
            return ["$scope", "$stateParams", Services.Logger.ID, Services.UiHelper.ID, Services.Utilities.ID, "versionInfo"];
        }

        private $stateParams: ILogEntryStateParams;
        private Logger: Services.Logger;
        private UiHelper: Services.UiHelper;
        private Utilities: Services.Utilities;
        private versionInfo: Interfaces.VersionInfo;

        private _fullLogEntry: Models.LogEntry;

        constructor($scope: ng.IScope, $stateParams: ILogEntryStateParams, Logger: Services.Logger, UiHelper: Services.UiHelper, Utilities: Services.Utilities, versionInfo: Interfaces.VersionInfo) {
            super($scope, ViewModels.LogEntryViewModel);

            this.$stateParams = $stateParams;
            this.Logger = Logger;
            this.UiHelper = UiHelper;
            this.Utilities = Utilities;
            this.versionInfo = versionInfo;
        }

        //#region BaseController Overrides

        protected view_beforeEnter(): void {
            super.view_beforeEnter();

            this.Logger.getLog(this.$stateParams.id).then(_.bind(this.getLogEntry_success, this));
        }

        //#endregion

        //#region Private Helper Methods

        private getLogEntry_success(logEntry: Models.LogEntry): void {
            var formattedDate: string;

            // First, save off the entire log entry so it is available if the user attempts
            // to use the copy or email functionality.
            this._fullLogEntry = logEntry;

            // Now use the actual log entry to create the view model.
            this.viewModel.id = logEntry.id;
            this.viewModel.message = logEntry.message;
            this.viewModel.lineNumber = logEntry.lineNumber;
            this.viewModel.colNumber = logEntry.colNumber;
            this.viewModel.uri = logEntry.uri;
            this.viewModel.error = logEntry.error;
            this.viewModel.httpBody = logEntry.httpBody;
            this.viewModel.httpHeaders = logEntry.httpHeaders;
            this.viewModel.httpStatus = logEntry.httpStatus;
            this.viewModel.httpStatusText = logEntry.httpStatusText;
            this.viewModel.httpUrl = logEntry.httpUrl;
            this.viewModel.httpMethod = logEntry.httpMethod;

            // Format the date and time for display.
            this.viewModel.time = moment(logEntry.timestamp).format("h:mm:ss a");
            this.viewModel.date = formattedDate = moment(logEntry.timestamp).format("l");

            if (logEntry.error == null) {
                // If an error object isn't present, then this is likely one of the
                // unhandled JS exceptions (eg window.onerror).
                this.viewModel.iconType = "alert";
            }
            else {
                // If an error object is present then this error either came from Angular
                // or it was a manually logged error object.
                this.viewModel.iconType = "alert-circled";
            }

            // If this error has HTTP data, then it came from a RESTful API request.
            if (logEntry.httpUrl) {
                this.viewModel.iconType = "android-wifi";
            }
        }

        //#endregion

        //#region Controller Methods

        protected copy_click(): void {
            this.UiHelper.clipboard.copy(JSON.stringify(this._fullLogEntry), () => {
                this.UiHelper.toast.showShortBottom("Log copied to clipboard!");
            }, null);
        }

        protected email_click(): void {
            this.Logger.getLog(this.$stateParams.id).then((logEntry: Models.LogEntry) => {
                var uri = this.Utilities.format("mailto:{0}?subject={1} Error Log&body={2}", this.versionInfo.email, this.versionInfo.applicationName, JSON.stringify(logEntry));
                uri = encodeURI(uri);
                window.open(uri, "_system");
            });
        }

        //#endregion
    }
}
