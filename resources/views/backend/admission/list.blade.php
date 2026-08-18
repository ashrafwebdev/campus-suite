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
            <small>List</small>
        </h1>
        <ol class="breadcrumb">
            <li><a href="{{URL::route('user.dashboard')}}"><i class="fa fa-dashboard"></i> Dashboard</a></li>
            <li class="active">Admission Enquiry</li>
        </ol>
    </section>
    <!-- ./Section header -->
    <!-- Main content -->
    <section class="content">
        <div class="row">
            <div class="col-md-12">
                <div class="box box-info">
                    <div class="box-header">
                        <div class="box-tools pull-left">
                            <select id="status_filter" class="form-control" style="width: 200px; display: inline-block;">
                                <option value="">All Status</option>
                                @foreach(\App\Http\Helpers\AppHelper::ADMISSION_ENQUIRY_STATUS as $key => $label)
                                    <option value="{{$key}}" @if($status == $key) selected @endif>{{$label}}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="box-tools pull-right">
                            <a class="btn btn-info btn-sm" href="{{ URL::route('admission.enquiry_create') }}"><i class="fa fa-plus-circle"></i> Add New</a>
                        </div>
                    </div>
                    <!-- /.box-header -->
                    <div class="box-body margin-top-20">
                        <div class="table-responsive">
                        <table id="listDataTableWithSearch" class="table table-bordered table-striped list_view_table display responsive no-wrap" width="100%">
                            <thead>
                            <tr>
                                <th width="5%">#</th>
                                <th width="10%">Enquiry No</th>
                                <th width="12%">Name</th>
                                <th width="10%">Phone</th>
                                <th width="10%">Interested Class</th>
                                <th width="10%">Source</th>
                                <th width="10%">Status</th>
                                <th width="8%">Follow Up</th>
                                <th class="notexport" width="15%">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            @foreach($enquiries as $enquiry)
                                <tr>
                                    <td>
                                        {{$loop->iteration}}
                                    </td>
                                    <td>{{ $enquiry->enquiry_no }}</td>
                                    <td>{{ $enquiry->name }}</td>
                                    <td>{{ $enquiry->phone_no }}</td>
                                    <td>{{ $enquiry->iclass->name ?? '-' }}</td>
                                    <td>{{ $enquiry->source }}</td>
                                    <td>
                                        <span class="label
                                            @if($enquiry->getOriginal('status') == 4) label-success
                                            @elseif($enquiry->getOriginal('status') == 5) label-danger
                                            @else label-warning @endif">
                                            {{ $enquiry->status }}
                                        </span>
                                    </td>
                                    <td>{{ $enquiry->follow_up_date ? \Carbon\Carbon::parse($enquiry->follow_up_date)->format('d M Y') : '-' }}</td>
                                    <td>
                                        <div class="btn-group">
                                            <a title="Edit" href="{{URL::route('admission.enquiry_edit',$enquiry->id)}}" class="btn btn-info btn-sm"><i class="fa fa-edit"></i></a>
                                            @if($enquiry->getOriginal('status') != 4)
                                                <a title="Convert to Student" href="{{URL::route('admission.enquiry_convert',$enquiry->id)}}" class="btn btn-success btn-sm"><i class="fa fa-graduation-cap"></i></a>
                                            @endif
                                        </div>
                                        <div class="btn-group">
                                            <form  class="myAction" method="POST" action="{{URL::route('admission.enquiry_destroy')}}">
                                                @csrf
                                                <input type="hidden" name="hiddenId" value="{{$enquiry->id}}">
                                                <button type="submit" class="btn btn-danger btn-sm" title="Delete">
                                                    <i class="fa fa-fw fa-trash"></i>
                                                </button>
                                            </form>
                                        </div>

                                    </td>
                                </tr>
                            @endforeach

                            </tbody>
                            <tfoot>
                            <tr>
                                <th width="5%">#</th>
                                <th width="10%">Enquiry No</th>
                                <th width="12%">Name</th>
                                <th width="10%">Phone</th>
                                <th width="10%">Interested Class</th>
                                <th width="10%">Source</th>
                                <th width="10%">Status</th>
                                <th width="8%">Follow Up</th>
                                <th class="notexport" width="15%">Action</th>
                            </tr>
                            </tfoot>
                        </table>
                    </div>
                    </div>
                    <!-- /.box-body -->
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
            Admission.enquiryListInit();
        });
    </script>
@endsection
<!-- END PAGE JS-->
