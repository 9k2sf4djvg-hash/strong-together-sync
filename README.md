# Iron Sync

Strong Together - אפליקציית ניהול אימונים | Lovable Prompt

🎯 תיאור הפרויקט

בנה לי אפליקציית ניהול אימונים מקצועית בשם Strong Together עם React + TypeScript + Tailwind CSS 4. האפליקציה מאפשרת למאמנים (coaches) לתכנן בלוקי אימונים ולמתאמנים (trainees) לבצע אימונים ולעדכן התקדמות.

דרישות עיקריות:

•
ממשק משתמש responsive שעובד בטלפון, טאבלט ודסקטופ

•
תמיכה מלאה בעברית (RTL)

•
Dark mode ו-Light mode

•
שני ממשקים שונים: אחד למאמן ואחד למתאמן

•
PWA-ready (ניתן להתקין על מסך הבית)




👥 תפקידים ודרישות

תפקיד 1: מאמן (Coach)

מה המאמן עושה:

1.
בוחר מתאמן מרשימה

2.
יוצר בלוק אימונים עם:

•
שם בלוק

•
מספר שבועות

•
מספר אימונים בשבוע

1.
בונה אימונים עם:

•
כותרת (בחירה מרשימה: Legs, Upper Body, Chest, Back, Arms, Shoulders, או כתיבה חופשית)

•
תרגילים מרשימה קיימת

•
סטים לכל תרגיל (חזרות, משקל, RPE)

1.
מוסיף הערות מאמן לכל תרגיל

2.
שוכפל שבועות עם אינדיקציה לשדות שחייבים עדכון

3.
קובל התראות כשמתאמן מסיים שבוע

4.
צופה בהערות המתאמן וב-RPE בפועל

תפקיד 2: מתאמן (Trainee)

מה המתאמן עושה:

1.
רואה רק את השבוע הנוכחי בבלוק

2.
בוחר אימון מהרשימה השבועית

3.
מבצע אימון עם:

•
עדכון RPE בפועל לכל סט

•
הוספת הערות אישיות

•
סימון סטים כ"דילגתי" עם הסבר

•
סימון תרגילים כ"דילגתי" עם הסבר

1.
מסיים אימון כשכל הסטים עודכנו

2.
יכול לשנות אימון עד 24 שעות לאחר סיום

3.
רואה הודעה כשהמאמן סיים לסקור את האימונים




🎨 ממשק המאמן (Coach Interface)

עמוד 1: בחירת מתאמן

Plain Text


┌─────────────────────────────────────┐
│ Strong Together - מאמן              │
├─────────────────────────────────────┤
│                                     │
│ בחר מתאמן:                          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 אלכס כהן                      │ │
│ │ בלוק: "הכנה לקיץ" (שבוע 2/8)    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 דן לוי                        │ │
│ │ בלוק: "חוזק בסיסי" (שבוע 1/4)   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ בלוק חדש]                        │
│                                     │
└─────────────────────────────────────┘



עמוד 2: הגדרת בלוק חדש

Plain Text


┌─────────────────────────────────────┐
│ בלוק חדש - אלכס כהן                 │
├─────────────────────────────────────┤
│                                     │
│ שם הבלוק:                           │
│ [________________]                  │
│                                     │
│ מספר שבועות:                        │
│ [_____]                             │
│                                     │
│ אימונים בשבוע:                      │
│ [_____]                             │
│                                     │
│ [המשך] [ביטול]                      │
│                                     │
└─────────────────────────────────────┘



עמוד 3: בניית אימון

Plain Text


┌─────────────────────────────────────┐
│ בניית אימון - שבוע 1, אימון 1       │
├─────────────────────────────────────┤
│                                     │
│ כותרת אימון:                        │
│ [בחר: Legs / Upper / Chest / ...]   │
│ או כתיבה חופשית: [____________]     │
│                                     │
│ תרגילים:                            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ תרגיל 1: Squat                  │ │
│ │ ├─ סט 1: 5 חזרות, 100 ק"ג, RPE 8│ │
│ │ ├─ סט 2: 5 חזרות, 100 ק"ג, RPE 8│ │
│ │ ├─ סט 3: 5 חזרות, 100 ק"ג, RPE 9│ │
│ │ └─ [שנה] [הערת מאמן]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ הוסף תרגיל] [שמור אימון]         │
│                                     │
└─────────────────────────────────────┘



עמוד 4: סקירה ושמירה של אימון

Plain Text


┌─────────────────────────────────────┐
│ סקירה - אימון 1                     │
├─────────────────────────────────────┤
│                                     │
│ כותרת: Legs                         │
│                                     │
│ Squat                               │
│ • 5 חזרות, 100 ק"ג, RPE 8          │
│ • 5 חזרות, 100 ק"ג, RPE 8          │
│ • 5 חזרות, 100 ק"ג, RPE 9          │
│ הערת מאמן: "שמור על הגב ישר"       │
│                                     │
│ Leg Press                           │
│ • 10 חזרות, 150 ק"ג, RPE 7         │
│ • 10 חזרות, 150 ק"ג, RPE 8         │
│                                     │
│ [שמור] [המשך לשנות]                 │
│                                     │
└─────────────────────────────────────┘



עמוד 5: שכפול שבועות

Plain Text


┌─────────────────────────────────────┐
│ בלוק: הכנה לקיץ                      │
├─────────────────────────────────────┤
│                                     │
│ שבוע 1 ✓                            │
│ ├─ אימון 1: Legs                   │
│ ├─ אימון 2: Upper Body             │
│ ├─ אימון 3: Chest                  │
│ └─ [הכפל שבוע 1]                    │
│                                     │
│ שבוע 2                              │
│ ├─ אימון 1: Legs (משקל: 🔴)        │
│ ├─ אימון 2: Upper Body (משקל: 🔴) │
│ ├─ אימון 3: Chest (משקל: 🔴)      │
│ └─ [עדכן שבוע] [שלח לאלכס]         │
│                                     │
│ (שדות אדומים = חובה עדכון)         │
│                                     │
└─────────────────────────────────────┘






🎮 ממשק המתאמן (Trainee Interface)

עמוד 1: השבוע הנוכחי

Plain Text


┌─────────────────────────────────────┐
│ Strong Together - מתאמן              │
├─────────────────────────────────────┤
│                                     │
│ שבוע 2 / בלוק "הכנה לקיץ"           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ אימון 1 - Legs                  │ │
│ │ [התחל אימון]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ אימון 2 - Upper Body            │ │
│ │ [התחל אימון]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ אימון 3 - Chest                 │ │
│ │ [התחל אימון]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘



עמוד 2: ביצוע אימון

Plain Text


┌─────────────────────────────────────┐
│ אימון 1 - Legs                      │
├─────────────────────────────────────┤
│                                     │
│ Squat                               │
│                                     │
│ סט 1:                               │
│ • 5 חזרות, 100 ק"ג, RPE מטרה: 8   │
│ • RPE בפועל: [_] 🔴                 │
│ • הערות: [_________________]        │
│ • [דילגתי]                          │
│                                     │
│ סט 2:                               │
│ • 5 חזרות, 100 ק"ג, RPE מטרה: 8   │
│ • RPE בפועל: [_] 🔴                 │
│ • הערות: [_________________]        │
│ • [דילגתי]                          │
│                                     │
│ סט 3:                               │
│ • 5 חזרות, 100 ק"ג, RPE מטרה: 9   │
│ • RPE בפועל: [_] 🔴                 │
│ • הערות: [_________________]        │
│ • [דילגתי]                          │
│                                     │
│ [עדכן תרגיל] [דילגתי]               │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ Leg Press                           │
│ • [עדכן תרגיל] [דילגתי]             │
│                                     │
│ [סיים אימון]                        │
│                                     │
└─────────────────────────────────────┘



עמוד 3: סיום אימון

Plain Text


┌─────────────────────────────────────┐
│ אימון הושלם בהצלחה! ✓               │
├─────────────────────────────────────┤
│                                     │
│ אימון 1 - Legs                      │
│ ביצוע: 3/3 תרגילים                 │
│ סטים: 8/8 סטים                     │
│                                     │
│ [שנה אימון] (זמין עד מחר)           │
│ [חזור לשבוע]                        │
│                                     │
└─────────────────────────────────────┘



עמוד 4: סיום שבוע

Plain Text


┌─────────────────────────────────────┐
│ שבוע 2 - בלוק "הכנה לקיץ"           │
├─────────────────────────────────────┤
│                                     │
│ ✓ אימון 1 - Legs                   │
│ ✓ אימון 2 - Upper Body             │
│ ✓ אימון 3 - Chest                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ המאמן ראה את האימונים           │ │
│ │ חכה לעדכון השבוע הבא            │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘






🎨 עיצוב ויזואלי

צבעים (Dark Mode):

•
Background: #0f172a (כחול כהה מאוד)

•
Surface: #1e293b (כחול כהה)

•
Primary: #10b981 (ירוק)

•
Accent: #f59e0b (כתום)

•
Danger: #ef4444 (אדום)

•
Success: #10b981 (ירוק)

•
Warning: #f59e0b (כתום)

•
Text: #f1f5f9 (לבן בהיר)

•
Text Secondary: #cbd5e1 (אפור בהיר)

צבעים (Light Mode):

•
Background: #ffffff

•
Surface: #f8fafc

•
Primary: #059669 (ירוק)

•
Accent: #d97706 (כתום)

•
Danger: #dc2626 (אדום)

•
Success: #059669 (ירוק)

•
Warning: #d97706 (כתום)

•
Text: #0f172a (כחול כהה)

•
Text Secondary: #475569 (אפור)

טיפוגרפיה:

•
Font: Inter / Segoe UI / System Font

•
Headings: Bold, 24px-32px

•
Body: Regular, 14px-16px

•
Small: Regular, 12px-13px

אינדיקציות ויזואליות:

•
שדות חובה עדכון: צבע אדום (#ef4444)

•
סטים דלוגים: קו חוצה (line-through) + opacity 0.5

•
תרגילים דלוגים: קו חוצה + opacity 0.5

•
RPE בפועל: צבע כתום (#f59e0b) כאינדיקציה

•
סטים שהושלמו: ✓ בירוק (#10b981)

Responsive Design:

•
Mobile: 320px - 640px (primary)

•
Tablet: 641px - 1024px

•
Desktop: 1025px+

•
Layout: Single column on mobile, multi-column on tablet/desktop

RTL Support:

•
Text Alignment: ימין לשמאל

•
Flex Direction: reversed

•
Padding/Margin: mirrored

•
Icons: flipped where appropriate




🔐 Authentication & State Management

Authentication:

•
Login Screen: אימייל וסיסמה

•
Role-based Access: מאמן vs מתאמן

•
Session Persistence: localStorage (עבור demo)

•
Logout: כפתור בפינה העליונה

State Management:

•
User State: מי המשתמש הנוכחי ותפקידו

•
Current Block: איזה בלוק מעודכן כרגע

•
Current Week: איזה שבוע מוצג

•
Notifications: רשימת התראות




📱 PWA Requirements

•
Manifest: manifest.json עם icon, name, description

•
Service Worker: לcaching בסיסי

•
Install Prompt: כפתור "התקן אפליקציה"

•
Offline Support: עמוד offline בסיסי




🎯 Interaction Patterns

Buttons:

•
Primary: ירוק (#10b981), padding: 12px 24px, border-radius: 8px

•
Secondary: אפור, outline

•
Danger: אדום, עבור פעולות מסוכנות

•
Disabled: opacity 0.5, cursor: not-allowed

Modals/Dialogs:

•
Confirmation: "האם אתה בטוח?"

•
Input: עבור הוספת הערות

•
Alert: עבור שגיאות

Forms:

•
Input Fields: border, padding, focus state

•
Validation: error messages בצבע אדום

•
Placeholders: בעברית

Cards:

•
Workout Cards: shadow, padding, hover effect

•
Exercise Cards: expandable, with actions

•
Set Cards: compact, with inline editing




📊 Mock Data Structure

משתמשים:

Plain Text


{
  id: 1,
  name: "אלכס כהן",
  email: "alex@example.com",
  role: "coach"
}

{
  id: 2,
  name: "דן לוי",
  email: "dan@example.com",
  role: "trainee"
}



בלוק אימונים:

Plain Text


{
  id: 1,
  coachId: 1,
  traineeId: 2,
  name: "הכנה לקיץ",
  weeks: 8,
  workoutsPerWeek: 3,
  weeks: [
    {
      weekNumber: 1,
      workouts: [
        {
          id: 1,
          title: "Legs",
          exercises: [
            {
              id: 1,
              name: "Squat",
              coachNotes: "שמור על הגב ישר",
              sets: [
                { reps: 5, weight: 100, rpe: 8 },
                { reps: 5, weight: 100, rpe: 8 },
                { reps: 5, weight: 100, rpe: 9 }
              ]
            }
          ]
        }
      ]
    }
  ]
}






✅ Features Checklist

Coach Interface:




בחירת מתאמן




יצירת בלוק חדש




בניית אימונים




הוספת תרגילים




הוספת סטים




הערות מאמן




שכפול שבועות




סקירה ושמירה




צפייה בהערות מתאמן




צפייה ב-RPE בפועל




התראות

Trainee Interface:




צפייה בשבוע הנוכחי




בחירת אימון




ביצוע אימון




עדכון RPE בפועל




הוספת הערות




סימון סטים כדילוגים




סימון תרגילים כדילוגים




סיום אימון




שינוי אימון (עד 24 שעות)




צפייה בהודעה לאחר סיום שבוע

General:




Dark Mode / Light Mode




RTL Support (עברית)




Responsive Design




Authentication




Notifications




PWA Support




Error Handling




Loading States




🚀 Implementation Notes

Priority 1 (MVP):

1.
Authentication & Role-based access

2.
Coach: Create block, add workouts, add exercises, add sets

3.
Trainee: View current week, start workout, update RPE, complete workout

4.
Basic notifications

Priority 2:

1.
Coach: Duplicate weeks with color indicators

2.
Trainee: Skip exercises/sets with reasons

3.
Edit workout within 24 hours

4.
View coach notes

Priority 3:

1.
PWA installation

2.
Offline support

3.
Advanced notifications

4.
Analytics




💡 Design Tips

1.
Keep it Simple: ממשק נקי וברור, בלי עומס מידע

2.
Mobile First: עיצוב תחילה לטלפון, אחר כך להרחבה

3.
Visual Hierarchy: כפתורים חשובים בולטים

4.
Feedback: כל פעולה צריכה feedback (toast, loading, etc.)

5.
Accessibility: גדלים גדולים, צבעים ברורים, contrast טוב

6.
Performance: טוען מהר, responsive interactions




זה הprompt שלך ל-Lovable!

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://strong-together-sync.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e5e595bc-1fe4-494a-9636-fa578a21dc29).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
