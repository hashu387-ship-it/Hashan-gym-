import type { ExerciseInfo } from './types';

/**
 * Every exercise in the program and its swap alternatives.
 * `demo` points at public-domain start/end photos from free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db, Unlicense), stored in public/demos/.
 */
export const EXERCISES: ExerciseInfo[] = [
  // ---------- Upper A ----------
  {
    id: 'bench-press', name: 'Barbell bench press', body: 'upper', demo: 'Barbell_Bench_Press_-_Medium_Grip',
    muscles: 'Chest, front shoulders, triceps',
    how: [
      'Lie on the bench with eyes under the bar, feet flat on the floor.',
      'Grip a little wider than shoulders. Squeeze shoulder blades together and down.',
      'Lower the bar slowly to the middle of your chest, elbows about 45 degrees from your body.',
      'Press back up until arms are straight. Breathe in going down, out going up.',
    ],
    avoid: ['Bouncing the bar off your chest.', 'Lifting your hips off the bench.'],
  },
  {
    id: 'seated-cable-row', name: 'Seated cable row', body: 'upper', demo: 'Seated_Cable_Rows',
    muscles: 'Middle back, lats, biceps',
    how: [
      'Sit with feet on the platform and knees slightly bent. Hold the handle with straight arms.',
      'Sit tall, chest up.',
      'Pull the handle to your belly, squeezing shoulder blades together.',
      'Let the arms go straight again slowly, without rounding your back.',
    ],
    avoid: ['Rocking far back to swing the weight.', 'Shrugging shoulders up to your ears.'],
  },
  {
    id: 'incline-db-press', name: 'Incline dumbbell press', body: 'upper', demo: 'Incline_Dumbbell_Press',
    muscles: 'Upper chest, front shoulders, triceps',
    how: [
      'Set the bench to about 30 degrees. Sit back with a dumbbell on each thigh.',
      'Kick the dumbbells up one at a time and lie back, weights at shoulder level.',
      'Press up and slightly together until arms are straight.',
      'Lower slowly until the dumbbells are beside your upper chest.',
    ],
    avoid: ['Setting the bench too steep (it turns into a shoulder press).', 'Clanging the dumbbells together at the top.'],
  },
  {
    id: 'db-shoulder-press', name: 'Seated dumbbell shoulder press', body: 'upper', demo: 'Seated_Dumbbell_Press',
    muscles: 'Shoulders, triceps',
    how: [
      'Sit on a bench with an upright back support. Dumbbells at shoulder height, palms forward.',
      'Brace your stomach and keep your back against the pad.',
      'Press the dumbbells straight up until arms are almost straight.',
      'Lower slowly back to shoulder height.',
    ],
    avoid: ['Arching your lower back off the pad.', 'Lowering the weights too far behind your head.'],
  },
  {
    id: 'lateral-raise', name: 'Lateral raise', body: 'upper', demo: 'Side_Lateral_Raise',
    muscles: 'Side shoulders',
    how: [
      'Stand tall with a light dumbbell in each hand at your sides.',
      'With a small bend in the elbows, raise the arms out to the sides.',
      'Stop when hands reach shoulder height.',
      'Lower slowly, taking about 2 seconds.',
    ],
    avoid: ['Swinging the body to lift heavy weights.', 'Raising hands above shoulder height.'],
  },
  {
    id: 'rope-pushdown', name: 'Triceps rope pushdown', body: 'upper', demo: 'Triceps_Pushdown_-_Rope_Attachment',
    muscles: 'Triceps',
    how: [
      'Attach a rope to a high cable. Hold one end in each hand, elbows tucked at your sides.',
      'Push the rope down until arms are straight, spreading the ends apart at the bottom.',
      'Squeeze the back of your arms for a second.',
      'Let the rope come back up to chest height slowly. Elbows stay still.',
    ],
    avoid: ['Elbows drifting forward.', 'Leaning over the rope to push with body weight.'],
  },

  // ---------- Lower A ----------
  {
    id: 'back-squat', name: 'Back squat', body: 'lower', demo: 'Barbell_Squat',
    muscles: 'Thighs, glutes, lower back',
    how: [
      'Set the bar in the rack at chest height. Step under it so it sits on your upper back, not your neck.',
      'Feet shoulder-width, toes turned out a little. Take a big breath and brace.',
      'Sit down and back, knees following your toes, until thighs are at least parallel to the floor.',
      'Drive up through your whole foot to standing. Breathe out at the top.',
    ],
    avoid: ['Knees caving inward.', 'Heels lifting or chest dropping forward.'],
  },
  {
    id: 'db-rdl', name: 'Dumbbell Romanian deadlift', body: 'lower', demo: 'Stiff-Legged_Dumbbell_Deadlift',
    muscles: 'Hamstrings, glutes, lower back',
    how: [
      'Stand with dumbbells in front of your thighs, knees slightly bent.',
      'Push your hips back and let the dumbbells slide down the front of your legs.',
      'Keep your back flat. Stop when you feel a stretch in the back of the thighs, around mid-shin.',
      'Squeeze your glutes and push hips forward to stand up.',
    ],
    avoid: ['Rounding your back.', 'Bending the knees so much it becomes a squat.'],
  },
  {
    id: 'leg-press', name: 'Leg press', body: 'lower', demo: 'Leg_Press',
    muscles: 'Thighs, glutes',
    how: [
      'Sit in the machine with your back flat against the pad. Feet shoulder-width on the platform.',
      'Release the safety handles.',
      'Lower the platform slowly until knees are at about 90 degrees.',
      'Push back up without locking your knees straight.',
    ],
    avoid: ['Lower back lifting off the pad at the bottom.', 'Locking the knees hard at the top.'],
  },
  {
    id: 'lying-leg-curl', name: 'Lying leg curl', body: 'lower', demo: 'Lying_Leg_Curls',
    muscles: 'Hamstrings',
    how: [
      'Lie face down with the pad just above your heels and knees just off the bench edge.',
      'Hold the handles and keep hips pressed down.',
      'Curl your heels toward your glutes.',
      'Lower slowly until legs are almost straight.',
    ],
    avoid: ['Hips lifting off the bench.', 'Dropping the weight quickly.'],
  },
  {
    id: 'standing-calf', name: 'Standing calf raise', body: 'lower', demo: 'Standing_Calf_Raises',
    muscles: 'Calves',
    how: [
      'Stand on the edge of the platform with the balls of your feet, shoulders under the pads.',
      'Let your heels drop down for a full stretch.',
      'Rise up onto your toes as high as you can and hold for 1 second.',
      'Lower slowly.',
    ],
    avoid: ['Bouncing quickly with a short range.', 'Bending the knees to help.'],
  },
  {
    id: 'plank', name: 'Plank', body: 'core', demo: 'Plank',
    muscles: 'Stomach, core',
    how: [
      'Forearms on the floor, elbows under shoulders.',
      'Legs straight behind you, on your toes.',
      'Squeeze glutes and stomach so your body is a straight line from head to heels.',
      'Breathe normally and hold for the time.',
    ],
    avoid: ['Hips sagging down.', 'Hips pushed high in the air.'],
  },

  // ---------- Upper B ----------
  {
    id: 'lat-pulldown', name: 'Lat pulldown', body: 'upper', demo: 'Wide-Grip_Lat_Pulldown',
    muscles: 'Lats, upper back, biceps',
    how: [
      'Sit with thighs under the pad. Grip the bar a little wider than shoulders.',
      'Lean back slightly, chest up.',
      'Pull the bar down to your upper chest, driving elbows down and back.',
      'Let the bar go up slowly until arms are straight.',
    ],
    avoid: ['Pulling the bar behind your neck.', 'Leaning far back and yanking with body weight.'],
  },
  {
    id: 'chest-supported-row', name: 'Chest-supported row', body: 'upper', demo: 'Dumbbell_Incline_Row',
    muscles: 'Middle back, rear shoulders, biceps',
    how: [
      'Set a bench to about 30-45 degrees. Lie face down with your chest on the pad.',
      'Let the dumbbells hang straight down, palms facing each other.',
      'Row the dumbbells up toward your lower ribs, squeezing shoulder blades together.',
      'Lower slowly until arms are straight.',
    ],
    avoid: ['Lifting your chest off the pad.', 'Shrugging instead of rowing.'],
  },
  {
    id: 'machine-chest-press', name: 'Machine chest press', body: 'upper', demo: 'Machine_Bench_Press',
    muscles: 'Chest, front shoulders, triceps',
    how: [
      'Set the seat so the handles are level with the middle of your chest.',
      'Back flat on the pad, shoulder blades pulled back.',
      'Press the handles forward until arms are straight.',
      'Return slowly until you feel a light stretch in the chest.',
    ],
    avoid: ['Seat set too low or too high.', 'Letting the weight stack slam.'],
  },
  {
    id: 'face-pull', name: 'Face pull', body: 'upper', demo: 'Face_Pull',
    muscles: 'Rear shoulders, upper back',
    how: [
      'Set a rope on a cable at face height. Hold the ends with thumbs pointing back toward you.',
      'Step back so the arms are straight and the cable is tight.',
      'Pull the rope toward your face, elbows high, hands ending beside your ears.',
      'Hold 1 second, then return slowly.',
    ],
    avoid: ['Using too much weight and leaning back.', 'Letting elbows drop low.'],
  },
  {
    id: 'db-curl', name: 'Dumbbell curl', body: 'upper', demo: 'Dumbbell_Bicep_Curl',
    muscles: 'Biceps',
    how: [
      'Stand tall with dumbbells at your sides, palms facing forward.',
      'Keep elbows close to your body.',
      'Curl the weights up to shoulder level.',
      'Lower slowly until arms are straight.',
    ],
    avoid: ['Swinging your back to lift.', 'Elbows moving forward.'],
  },
  {
    id: 'hammer-curl', name: 'Hammer curl', body: 'upper', demo: 'Hammer_Curls',
    muscles: 'Biceps, forearms',
    how: [
      'Stand with dumbbells at your sides, palms facing your body.',
      'Keep that grip and curl the weights up.',
      'Squeeze at the top.',
      'Lower slowly.',
    ],
    avoid: ['Swinging the body.', 'Rushing the lowering part.'],
  },

  // ---------- Lower B ----------
  {
    id: 'trap-bar-deadlift', name: 'Trap bar deadlift', body: 'lower', demo: 'Trap_Bar_Deadlift',
    muscles: 'Glutes, thighs, hamstrings, back',
    how: [
      'Stand in the middle of the trap bar, feet hip-width.',
      'Push hips back, bend knees and grab the handles. Back flat, chest up.',
      'Take a breath, brace, and push the floor away to stand up tall.',
      'Lower by pushing hips back first, then bending knees.',
    ],
    avoid: ['Rounding the lower back.', 'Jerking the bar off the floor.'],
  },
  {
    id: 'bulgarian-split-squat', name: 'Bulgarian split squat', body: 'lower', demo: 'Split_Squat_with_Dumbbells',
    muscles: 'Thighs, glutes',
    how: [
      'Stand about two steps in front of a bench. Put the top of your back foot on the bench.',
      'Hold dumbbells at your sides (start with body weight in week 1).',
      'Lower straight down until the front thigh is about parallel to the floor.',
      'Push up through the front heel. Do all reps on one leg, then switch.',
    ],
    avoid: ['Front knee caving inward.', 'Standing too close to the bench.'],
  },
  {
    id: 'hip-thrust', name: 'Hip thrust', body: 'lower', demo: 'Barbell_Hip_Thrust',
    muscles: 'Glutes, hamstrings',
    how: [
      'Sit on the floor with your upper back against a bench and a padded bar over your hips.',
      'Feet flat, about hip-width, knees bent.',
      'Drive hips up until your body is straight from shoulders to knees. Squeeze glutes hard.',
      'Lower slowly, keeping chin tucked.',
    ],
    avoid: ['Arching the lower back at the top.', 'Pushing through your toes instead of heels.'],
  },
  {
    id: 'leg-extension', name: 'Leg extension', body: 'lower', demo: 'Leg_Extensions',
    muscles: 'Front thighs',
    how: [
      'Sit in the machine with the pad on your lower shins and knees in line with the machine pivot.',
      'Hold the handles.',
      'Straighten your legs fully and squeeze the thighs for a second.',
      'Lower slowly.',
    ],
    avoid: ['Kicking the weight up fast.', 'Lifting your hips off the seat.'],
  },
  {
    id: 'seated-calf', name: 'Seated calf raise', body: 'lower', demo: 'Seated_Calf_Raise',
    muscles: 'Calves (lower part)',
    how: [
      'Sit with the pad on your lower thighs and the balls of your feet on the platform.',
      'Release the safety and let your heels drop for a stretch.',
      'Push up onto your toes as high as you can. Hold 1 second.',
      'Lower slowly.',
    ],
    avoid: ['Bouncing.', 'Only moving through half the range.'],
  },
  {
    id: 'cable-crunch', name: 'Cable crunch', body: 'core', demo: 'Cable_Crunch',
    muscles: 'Stomach',
    how: [
      'Kneel below a high cable holding a rope beside your head.',
      'Keep hips still.',
      'Crunch down by curling your chest toward your knees, breathing out.',
      'Come back up slowly.',
    ],
    avoid: ['Sitting back on your heels to pull with the hips.', 'Pulling with the arms.'],
  },

  // ---------- Thursday circuit ----------
  {
    id: 'goblet-squat', name: 'Goblet squat', body: 'lower', demo: 'Goblet_Squat',
    muscles: 'Thighs, glutes, core',
    how: [
      'Hold one dumbbell or kettlebell against your chest with both hands.',
      'Feet a little wider than shoulders.',
      'Sit down between your heels, elbows inside your knees, chest up.',
      'Stand up through your whole foot.',
    ],
    avoid: ['Heels lifting.', 'Leaning forward and letting the weight pull you down.'],
  },
  {
    id: 'push-up', name: 'Push-up', body: 'upper', demo: 'Pushups',
    muscles: 'Chest, shoulders, triceps, core',
    how: [
      'Hands a little wider than shoulders, body straight from head to heels.',
      'Lower your chest to a fist-height above the floor, elbows at about 45 degrees.',
      'Push back up to straight arms.',
      'If you cannot do 10, put your hands on a bench (incline push-up).',
    ],
    avoid: ['Hips sagging.', 'Elbows flaring straight out to the sides.'],
  },
  {
    id: 'one-arm-db-row', name: 'One-arm dumbbell row', body: 'upper', demo: 'One-Arm_Dumbbell_Row',
    muscles: 'Lats, middle back, biceps',
    how: [
      'Put one knee and the same hand on a bench. Back flat, like a table.',
      'Hold a dumbbell with the other hand, arm straight down.',
      'Row the dumbbell up to your hip, elbow close to your body.',
      'Lower slowly. Do all reps, then switch sides.',
    ],
    avoid: ['Twisting your body to lift.', 'Rounding your back.'],
  },
  {
    id: 'kb-swing', name: 'Kettlebell swing', body: 'full', demo: 'One-Arm_Kettlebell_Swings',
    muscles: 'Glutes, hamstrings, back, core',
    how: [
      'Stand with feet a little wider than shoulders. Hold the kettlebell with both hands.',
      'Hike it back between your legs by pushing your hips back, back flat.',
      'Snap your hips forward hard so the bell floats up to chest height. Arms just guide it.',
      'Let it swing back down and go straight into the next rep.',
    ],
    avoid: ['Squatting instead of hinging at the hips.', 'Lifting the bell with your arms.'],
  },
  {
    id: 'farmer-carry', name: 'Farmer carry', body: 'full', demo: 'Farmers_Walk',
    muscles: 'Grip, shoulders, core, legs',
    how: [
      'Pick up a heavy dumbbell in each hand, standing tall.',
      'Shoulders back and down, stomach tight.',
      'Walk with short, steady steps for 30 metres.',
      'Put the weights down carefully by bending your knees.',
    ],
    avoid: ['Leaning to one side.', 'Shrugging shoulders up.'],
  },
  {
    id: 'dead-bug', name: 'Dead bug', body: 'core', demo: 'Dead_Bug',
    muscles: 'Deep stomach muscles',
    how: [
      'Lie on your back, arms pointing at the ceiling, knees bent at 90 degrees above your hips.',
      'Press your lower back into the floor.',
      'Slowly lower the opposite arm and leg toward the floor.',
      'Bring them back and switch sides. Each side is one rep.',
    ],
    avoid: ['Lower back lifting off the floor.', 'Moving fast.'],
  },
  {
    id: 'side-plank', name: 'Side plank', body: 'core', demo: 'Side_Bridge',
    muscles: 'Side of stomach (obliques), core',
    how: [
      'Lie on your side with your forearm under your shoulder.',
      'Stack your feet, or bend the bottom knee to make it easier.',
      'Lift your hips so your body is a straight line.',
      'Hold for the time, then switch sides.',
    ],
    avoid: ['Hips dropping toward the floor.', 'Shoulder creeping up to your ear.'],
  },

  // ---------- Alternatives ----------
  {
    id: 'db-bench', name: 'Dumbbell bench press', body: 'upper', demo: 'Dumbbell_Bench_Press',
    muscles: 'Chest, front shoulders, triceps',
    how: [
      'Lie on a flat bench with dumbbells at chest level, palms facing your feet.',
      'Feet flat, shoulder blades pulled together.',
      'Press the dumbbells up until arms are straight.',
      'Lower slowly to the sides of your chest.',
    ],
    avoid: ['Dropping the dumbbells too low.', 'Lifting hips off the bench.'],
  },
  {
    id: 'hack-squat', name: 'Hack squat', body: 'lower', demo: 'Hack_Squat',
    muscles: 'Thighs, glutes',
    how: [
      'Stand in the machine with shoulders under the pads and back flat on the pad.',
      'Feet shoulder-width in the middle of the platform.',
      'Release the safety and squat down until thighs are parallel.',
      'Push up through your heels.',
    ],
    avoid: ['Heels lifting.', 'Locking knees hard at the top.'],
  },
  {
    id: 'smith-squat', name: 'Smith machine squat', body: 'lower', demo: 'Smith_Machine_Squat',
    muscles: 'Thighs, glutes',
    how: [
      'Set the bar at shoulder height and step under it, bar on your upper back.',
      'Feet slightly in front of the bar, shoulder-width.',
      'Unhook the bar and squat down until thighs are parallel.',
      'Push up and re-hook the bar when finished.',
    ],
    avoid: ['Feet too far back.', 'Knees caving inward.'],
  },
  {
    id: 'assisted-pullup', name: 'Assisted pull-up', body: 'upper', demo: 'Band_Assisted_Pull-Up',
    muscles: 'Lats, upper back, biceps',
    how: [
      'Use the assisted pull-up machine or a band looped on the bar under your knee or foot.',
      'Hold the bar a little wider than shoulders, arms straight.',
      'Pull your chest up toward the bar.',
      'Lower slowly to straight arms.',
    ],
    avoid: ['Kicking your legs.', 'Half reps that stop before arms are straight.'],
  },
  {
    id: 'single-arm-pulldown', name: 'Single-arm pulldown', body: 'upper', demo: 'One_Arm_Lat_Pulldown',
    muscles: 'Lats',
    how: [
      'Attach a single handle to the high cable and sit facing the machine.',
      'Hold the handle with one arm straight up.',
      'Pull the elbow down to your side.',
      'Let it go up slowly, then switch arms after the set.',
    ],
    avoid: ['Twisting the body to pull.', 'Shrugging.'],
  },
  {
    id: 'deadlift', name: 'Conventional deadlift', body: 'lower', demo: 'Barbell_Deadlift',
    muscles: 'Glutes, hamstrings, back, thighs',
    how: [
      'Stand with mid-foot under the bar, feet hip-width.',
      'Hinge down and grip the bar just outside your legs. Back flat, chest up.',
      'Brace and push the floor away, keeping the bar close to your legs.',
      'Stand tall, then lower the bar the same way.',
    ],
    avoid: ['Rounding the back.', 'Bar drifting away from your legs.'],
  },
  {
    id: 'barbell-rdl', name: 'Barbell Romanian deadlift', body: 'lower', demo: 'Romanian_Deadlift',
    muscles: 'Hamstrings, glutes',
    how: [
      'Stand holding a barbell at your thighs, knees slightly bent.',
      'Push your hips back, sliding the bar down your thighs.',
      'Stop at mid-shin or when your hamstrings are fully stretched, back flat.',
      'Push hips forward to stand.',
    ],
    avoid: ['Rounding the back.', 'Letting the bar move away from your legs.'],
  },
  {
    id: 'tbar-row', name: 'T-bar row', body: 'upper', demo: 'T-Bar_Row_with_Handle',
    muscles: 'Middle back, lats',
    how: [
      'Stand over the T-bar, knees bent, hinged forward with a flat back.',
      'Hold the handle with both hands.',
      'Row it up to your chest, squeezing your shoulder blades.',
      'Lower with control.',
    ],
    avoid: ['Standing up as you row.', 'Rounding your back.'],
  },
  {
    id: 'machine-row', name: 'Machine row', body: 'upper', demo: 'Leverage_Iso_Row',
    muscles: 'Middle back, lats',
    how: [
      'Set the seat so the handles are at chest height. Chest against the pad.',
      'Hold the handles with straight arms.',
      'Pull back until your hands are beside your ribs.',
      'Return slowly.',
    ],
    avoid: ['Leaning away from the pad.', 'Jerking the handles.'],
  },
  {
    id: 'seated-leg-curl', name: 'Seated leg curl', body: 'lower', demo: 'Seated_Leg_Curl',
    muscles: 'Hamstrings',
    how: [
      'Sit with the pad behind your lower calves and the thigh pad locked down.',
      'Knees in line with the machine pivot.',
      'Curl your heels down and back under the seat.',
      'Let them come back up slowly.',
    ],
    avoid: ['Thigh pad left loose.', 'Moving fast.'],
  },
  {
    id: 'glute-bridge', name: 'Glute bridge', body: 'lower', demo: 'Barbell_Glute_Bridge',
    muscles: 'Glutes, hamstrings',
    how: [
      'Lie on your back, knees bent, feet flat. A barbell or plate on your hips if you want load.',
      'Push through your heels and lift your hips.',
      'Squeeze glutes at the top for 1 second.',
      'Lower slowly.',
    ],
    avoid: ['Arching the lower back.', 'Feet too far from your body.'],
  },
  {
    id: 'cable-pull-through', name: 'Cable pull-through', body: 'lower', demo: 'Pull_Through',
    muscles: 'Glutes, hamstrings',
    how: [
      'Set a rope on a low cable. Face away from the machine with the rope between your legs.',
      'Walk forward a few steps, feet wider than hips.',
      'Push your hips back, letting the rope pull your hands between your legs. Back flat.',
      'Drive hips forward to stand tall and squeeze your glutes.',
    ],
    avoid: ['Squatting instead of hinging.', 'Pulling with the arms.'],
  },
  {
    id: 'walking-lunge', name: 'Walking lunge', body: 'lower', demo: 'Bodyweight_Walking_Lunge',
    muscles: 'Thighs, glutes',
    how: [
      'Stand tall, dumbbells at your sides if you use them.',
      'Take a long step forward and lower until both knees are about 90 degrees.',
      'Push through the front heel and bring the back foot forward into the next step.',
      'Keep your chest up the whole time.',
    ],
    avoid: ['Short steps that push the front knee far forward.', 'Back knee slamming the floor.'],
  },
  {
    id: 'step-up', name: 'Dumbbell step-up', body: 'lower', demo: 'Dumbbell_Step_Ups',
    muscles: 'Thighs, glutes',
    how: [
      'Stand in front of a box or bench at knee height, dumbbells at your sides.',
      'Put one whole foot on the box.',
      'Push through that heel to stand up on the box.',
      'Step down slowly. Do all reps on one leg, then switch.',
    ],
    avoid: ['Pushing off with the back foot.', 'Box too high.'],
  },
  {
    id: 'incline-push-up', name: 'Incline push-up', body: 'upper', demo: 'Incline_Push-Up',
    muscles: 'Chest, shoulders, triceps',
    how: [
      'Put your hands on a bench or the edge of a box, a little wider than shoulders.',
      'Walk your feet back until your body is straight.',
      'Lower your chest to the bench edge.',
      'Push back up.',
    ],
    avoid: ['Hips sagging.', 'Head dropping forward.'],
  },

  // ---------- Cardio ----------
  {
    id: 'incline-walk', name: 'Incline treadmill walk', body: 'full', demo: 'Walking_Treadmill',
    muscles: 'Heart, legs, fat burning',
    how: [
      'Set incline to 8-12 percent and speed to 5-5.5 km/h.',
      'Walk tall without holding the handrails.',
      'Keep a pace where you can still talk in short sentences (about 113-132 bpm on your band).',
      'Slow down for the last 2 minutes.',
    ],
    avoid: ['Holding the rails, which takes the work away.', 'Going so fast you cannot talk.'],
  },
  {
    id: 'stationary-bike', name: 'Stationary bike', body: 'full', demo: 'Bicycling_Stationary',
    muscles: 'Heart, legs',
    how: [
      'Set the seat so your knee is only slightly bent at the bottom of the pedal.',
      'Pick a resistance you can keep steady.',
      'Ride at an easy, talking pace (about 113-132 bpm).',
      'Ease off for the last 2 minutes.',
    ],
    avoid: ['Seat too low.', 'Resistance so high you bounce.'],
  },
  {
    id: 'elliptical', name: 'Elliptical', body: 'full', demo: 'Elliptical_Trainer',
    muscles: 'Heart, legs, arms',
    how: [
      'Step on, hold the moving handles and start pedalling.',
      'Stand tall and push and pull with the arms too.',
      'Keep an easy, talking pace (about 113-132 bpm).',
      'Slow down for the last 2 minutes.',
    ],
    avoid: ['Leaning on the handles.', 'Going so hard you cannot talk.'],
  },
];

export const EXERCISE_BY_ID: Record<string, ExerciseInfo> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

export function demoFrames(e: ExerciseInfo): [string, string] {
  return [`/demos/${e.demo}/0.jpg`, `/demos/${e.demo}/1.jpg`];
}
