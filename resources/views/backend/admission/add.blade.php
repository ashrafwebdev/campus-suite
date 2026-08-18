<!-- Master page  -->
@extends('backend.layouts.master')

<!-- Page title -->
@section('pageTitle') Admission Enquiry @endsection
<!-- End block -->

<!-- Page body extra class -->
@section('bodyCssClass') @endsection
<!-- End block -->

<!-- BEGIN PAGE CONTENT-->
@section('pageContent')
    <!-- Section header -->
    <section class="content-header">
        <h1>
            Admission Enquiry
            <small>@if($enquiry) Update @else Add New @endif</small>
        </h1>
        <ol class="breadcrumb">
            <li><a href="{{URL::route('user.dashboard')}}"><i class="fa fa-dashboard"></i> Dashboard</a></li>
            <li><a href="{{URL::route('admission.enquiry')}}"><i class="fa fa-address-card"></i> Admission Enquiry</a></li>
            <li class="active">@if($enquiry) Update @else Add @endif</li>
        </ol>
    </section>
    <!-- ./Section header -->
    <!-- Main content -->
    <section class="content">
        <div class="row">
            <div class="col-md-12">
                <div class="box box-info">
                    <form novalidate id="entryForm" action="@if($enquiry) {{URL::Route('admission.enquiry_update', $enquiry->id)}} @else {{URL::Route('admission.enquiry_store')}} @endif" method="post" enctype="multipart/form-data">
                        <div class="box-body">
                            @csrf
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group has-feedback">
                                        <label for="name">Name<span class="text-danger">*</span></label>
                                        <input autofocus type="text" class="form-control" name="name" placeholder="name" value="@if($enquiry){{ $enquiry->name }}@else{{ old('name') }} @endif" required minlength="2" maxlength="255">
                                        <span class="fa fa-info form-control-feedback"></span>
                                        <span class="text-danger">{{ $errors->first('name') }}</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group has-feedback">
                                        <label for="phone_no">Phone<span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" name="phone_no" placeholder="phone or mobile number" value="@if($enquiry){{ $enquiry->phone_no }}@else{{ old('phone_no') }}@endif" required maxlength="15">
                                        <span class="fa fa-phone form-control-feedback"></span>
                                        <span class="text-danger">{{ $errors->first('phone_no') }}</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group has-feedback">
                                        <label for="email">Email</label>
                                        <input type="email" class="form-control" name="email" placeholder="email" value="@if($enquiry){{ $enquiry->email }}@else{{ old('email') }}@endif" maxlength="255">
                                        <span class="fa fa-envelope form-control-feedback"></span>
                                        <span class="text-danger">{{ $errors->first('email') }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group has-feedback">
                                        <label for="guardian_name">Guardian Name</label>
                                        <input type="text" class="form-control" name="guardian_name" placeholder="guardian name" value="@if($enquiry){{ $enquiry->guardian_name }}@else{{ old('guardian_name') }}@endif" maxlength="255">
                                        <span class="text-danger">{{ $errors->first('guardian_name') }}</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group has-feedback">
                                        <label for="guardian_phone_no">Guardian Phone</label>
                                        <input type="text" class="form-control" name="guardian_phone_no" placeholder="guardian phone" value="@if($enquiry){{ $enquiry->guardian_phone_no }}@else{{ old('guardian_phone_no') }}@endif" maxlength="15">
                                        <span class="text-danger">{{ $errors->first('guardian_phone_no') }}</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group has-feedback">
                                        <label for="class_id">Interested Class</label>
                                        {!! Form::select('class_id', $classes, $enquiry ? $enquiry->getOriginal('class_id') : null, ['placeholder' => 'Pick a class...', 'class' => 'form-control select2']) !!}
                                        <span class="text-danger">{{ $errors->first('class_id') }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group has-feedback">
                                        <label for="source">Source<span class="text-danger">*</span></label>
                                        {!! Form::select('source', \App\Http\Helpers\AppHelper::ADMISSION_ENQUIRY_SOURCE, $source, ['class' => 'form-control select2', 'required' => 'true']) !!}
                                        <span class="text-danger">{{ $errors->first('source') }}</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group has-feedback">
                                        <label for="status">Status<span class="text-danger">*</span></label>
                                        {!! Form::select('status', \App\Http\Helpers\AppHelper::ADMISSION_ENQUIRY_STATUS, $status, ['class' => 'form-control select2', 'required' => 'true']) !!}
                                        <span class="text-danger">{{ $errors->first('status') }}</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group has-feedback">
                                        <label for="follow_up_date">Follow Up Date</label>
                                        <input type="text" readonly class="form-control date_picker_with_clear" name="follow_up_date" placeholder="date" value="@if($enquiry && $enquiry->follow_up_date){{ \Carbon\Carbon::parse($enquiry->follow_up_date)->format('d/m/Y') }}@else{{ old('follow_up_date') }}@endif">
                                        <span class="text-danger">{{ $errors->first('follow_up_date') }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group has-feedback">
                                        <label for="address">Address</label>
                                        <textarea name="address" class="form-control" maxlength="500">@if($enquiry){{ $enquiry->address }}@else{{ old('address') }}@endif</textarea>
                                        <span class="text-danger">{{ $errors->first('address') }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group has-feedback">
                                        <label for="note">Note</label>
                                        <textarea name="note" class="form-control" maxlength="500">@if($enquiry){{ $enquiry->note }}@else{{ old('note') }}@endif</textarea>
                                        <span class="text-danger">{{ $errors->first('note') }}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <!-- /.box-body -->
                        <div class="box-footer">
                            <a href="{{URL::route('admission.enquiry')}}" class="btn btn-default">Cancel</a>
                            <button type="submit" class="btn btn-info pull-right"><i class="fa @if($enquiry) fa-refresh @else fa-plus-circle @endif"></i> @if($enquiry) Update @else Add @endif</button>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    </section>
    <!-- /.content -->
@endsection
<!-- END PAGE CONTENT-->

<!-- BEGIN PAGE JS-->
@section('extraScript')
    <script type="text/javascript">
        $(document).ready(function () {
            Admission.enquiryFormInit();
        });
    </script>
@endsection
<!-- END PAGE JS-->
