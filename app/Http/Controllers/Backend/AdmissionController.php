<?php

namespace App\Http\Controllers\Backend;

use App\AdmissionEnquiry;
use App\Http\Helpers\AppHelper;
use App\IClass;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class AdmissionController extends Controller
{
    /**
     * enquiry list, filter and delete
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        //for delete on POST request
        if ($request->isMethod('post')) {
            $this->validate($request, [
                'hiddenId' => 'required|integer',
            ]);
            $enquiry = AdmissionEnquiry::findOrFail($request->get('hiddenId'));
            $enquiry->delete();

            return redirect()->route('admission.enquiry')->with('success', 'Record deleted!');
        }

        $status = $request->query->get('status', 0);

        $enquiries = AdmissionEnquiry::with('iclass')
            ->when($status, function ($query) use ($status) {
                return $query->where('status', $status);
            })
            ->orderBy('id', 'desc')
            ->get();

        return view('backend.admission.list', compact('enquiries', 'status'));
    }

    /**
     * enquiry create, read, update
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function cru(Request $request, $id = 0)
    {
        if ($request->isMethod('post')) {
            $this->validate($request, [
                'name' => 'required|min:2|max:255',
                'phone_no' => 'required|max:15',
                'email' => 'nullable|email|max:255',
                'guardian_name' => 'nullable|max:255',
                'guardian_phone_no' => 'nullable|max:15',
                'address' => 'nullable|max:500',
                'class_id' => 'nullable|integer',
                'source' => 'required|integer',
                'status' => 'required|integer',
                'follow_up_date' => 'nullable|date_format:d/m/Y',
                'note' => 'nullable|max:500',
            ]);

            $data = $request->all();

            if (strlen($request->get('follow_up_date', ''))) {
                $data['follow_up_date'] = Carbon::createFromFormat('d/m/Y', $request->get('follow_up_date'))->format('Y-m-d');
            } else {
                $data['follow_up_date'] = null;
            }

            if (!$id) {
                $data['enquiry_no'] = 'ADM-' . strtoupper(uniqid());
            }

            $enquiry = AdmissionEnquiry::updateOrCreate(
                ['id' => $id],
                $data
            );

            if (!$id) {
                $msg = $enquiry->name . " admission enquiry added by " . auth()->user()->name;
                AppHelper::sendNotificationToAdmins('info', $msg);
            }

            $msg = "Admission enquiry ";
            $msg .= $id ? 'updated.' : 'added.';

            return redirect()->route('admission.enquiry')->with('success', $msg);
        }

        $enquiry = AdmissionEnquiry::find($id);

        $status = $enquiry ? $enquiry->getOriginal('status') : 1;
        $source = $enquiry ? $enquiry->getOriginal('source') : 1;

        $classes = IClass::where('status', AppHelper::ACTIVE)
            ->orderBy('order', 'asc')
            ->pluck('name', 'id');

        return view('backend.admission.add', compact('enquiry', 'classes', 'status', 'source'));
    }

    /**
     * quick status update
     *
     * @param Request $request
     * @param int $id
     * @return array
     */
    public function changeStatus(Request $request, $id = 0)
    {
        $enquiry = AdmissionEnquiry::findOrFail($id);

        $status = (int)$request->get('status');
        if (!array_key_exists($status, AppHelper::ADMISSION_ENQUIRY_STATUS)) {
            return [
                'success' => false,
                'message' => 'Invalid status!',
            ];
        }

        $enquiry->status = $status;
        $enquiry->save();

        return [
            'success' => true,
            'message' => 'Status updated.',
        ];
    }

    /**
     * mark enquiry as admitted and hand off to the student admission form,
     * pre-filled with the enquiry details already collected.
     *
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function convert($id)
    {
        $enquiry = AdmissionEnquiry::findOrFail($id);

        $enquiry->status = 4; // Admitted
        $enquiry->save();

        return redirect()->route('student.create')->withInput([
            'name' => $enquiry->name,
            'phone_no' => $enquiry->phone_no,
            'email' => $enquiry->email,
            'guardian' => $enquiry->guardian_name,
            'guardian_phone_no' => $enquiry->guardian_phone_no,
            'permanent_address' => $enquiry->address,
        ])->with('success', 'Enquiry marked as admitted. Complete the student admission form below.');
    }
}
