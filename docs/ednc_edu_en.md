# ED&C Course Certificate Information Collection System

I am an FAE at a company called **ED&C**, and I also provide lectures on the EDA tools we sell.  
Currently, I have several students attending my lectures. After the course, I plan to issue course completion certificates, so I need to collect students' personal information.

I want to turn my computer into a web server so that students can access the webpage from their own computers and input the required information through their web browsers, which will then be sent to my server.

---

## Functional Requirements

- Since there can be multiple instructors and courses, the **instructor page** must include an **account creation and login feature**.
- After logging in, no success popup is necessary. The instructor should be redirected to their **dashboard**, where their name is displayed.
- **Login state must persist** even when navigating to different pages.
- On the instructor page:
  - Instructors can **create, delete, or edit** courses by entering the course name and schedule.
  - Clicking on a course will open the **student information page**, where instructors can **select all or some students** and **export the data to Excel**.
- **Students do not need to log in.** They simply click on the relevant course name created by the instructor and enter their information.
- **Student input fields**:
  - Name
  - English Name
  - Email
  - Affiliation
  - Phone Number
  - Date of Birth (YY/MM/DD)
- Students must be able to **edit or delete their submitted information** in case of input errors.

---

## Design Requirements

- The UI/UX should be **modern and trendy**, using **Material UI** or other current design trends.
- Avoid blue color themes, as they feel outdated; **prefer more contemporary color schemes**.
- All input forms, navigation menu buttons, etc., should be **displayed in Korean**.
- The default React app title in the browser should be **replaced** with the **program name**.
- **Program name**: `ED&C 교육 수강 정보`
