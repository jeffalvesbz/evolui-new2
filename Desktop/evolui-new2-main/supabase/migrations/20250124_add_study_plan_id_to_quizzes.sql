-- Add studyPlanId column to quizzes table
ALTER TABLE quizzes 
ADD COLUMN "studyPlanId" UUID REFERENCES study_plans(id) ON DELETE CASCADE;

-- Create index for faster filtering
CREATE INDEX idx_quizzes_study_plan_id ON quizzes("studyPlanId");
