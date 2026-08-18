import Generic from "./Generic";

export default class Admission {
    /**
     * Admission enquiry list page
     */
    static enquiryListInit() {
        Generic.initCommonPageJS();
        Generic.initDeleteDialog();

        $('#status_filter').on('change', function () {
            let status = $(this).val();
            let getUrl = window.location.href.split('?')[0];
            if (status) {
                getUrl += "?status=" + status;
            }
            window.location = getUrl;
        });
    }

    /**
     * Admission enquiry add/edit form
     */
    static enquiryFormInit() {
        Generic.initCommonPageJS();
    }
}
