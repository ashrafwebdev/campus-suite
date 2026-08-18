<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Hrshadhin\Userstamps\UserstampsTrait;
use App\Http\Helpers\AppHelper;
use Illuminate\Support\Arr;

class AdmissionEnquiry extends Model
{
    use SoftDeletes;
    use UserstampsTrait;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'enquiry_no',
        'name',
        'phone_no',
        'email',
        'guardian_name',
        'guardian_phone_no',
        'address',
        'class_id',
        'source',
        'status',
        'follow_up_date',
        'note',
        'student_id',
    ];

    public function iclass()
    {
        return $this->belongsTo('App\IClass', 'class_id');
    }

    public function student()
    {
        return $this->belongsTo('App\Student', 'student_id');
    }

    public function getSourceAttribute($value)
    {
        return Arr::get(AppHelper::ADMISSION_ENQUIRY_SOURCE, $value);
    }

    public function getStatusAttribute($value)
    {
        return Arr::get(AppHelper::ADMISSION_ENQUIRY_STATUS, $value);
    }
}
