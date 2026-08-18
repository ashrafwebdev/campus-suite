<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateAdmissionEnquiriesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('admission_enquiries', function (Blueprint $table) {
            $table->increments('id');
            $table->string('enquiry_no')->unique();
            $table->string('name');
            $table->string('phone_no');
            $table->string('email')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_phone_no')->nullable();
            $table->text('address')->nullable();
            $table->unsignedInteger('class_id')->nullable();
            // 1=Advertisement, 2=Website, 3=Referral, 4=Walk-in, 5=Social Media, 6=Other
            $table->unsignedTinyInteger('source')->default(1);
            // 1=New, 2=Contacted, 3=Follow Up, 4=Admitted, 5=Rejected
            $table->unsignedTinyInteger('status')->default(1);
            $table->date('follow_up_date')->nullable();
            $table->text('note')->nullable();
            $table->unsignedInteger('student_id')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->userstamps();

            $table->foreign('class_id')->references('id')->on('i_classes');
            $table->foreign('student_id')->references('id')->on('students');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('admission_enquiries');
    }
}
