document.addEventListener("DOMContentLoaded", function() {
    let courses = [];
    let electives = {};

    // Load courses and electives from local storage or fetch from the JSON file
    const storedCourses = localStorage.getItem('courseList');
    const storedElectives = localStorage.getItem('electivesList');
    if (storedCourses) {
        courses = JSON.parse(storedCourses);
        electives = storedElectives ? JSON.parse(storedElectives) : {};
        displayAllCourses();
    } else {
        fetch('data_version3.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(jsonData => {
                courses = jsonData.courses || [];
                electives = jsonData.electives || {};
                localStorage.setItem('courseList', JSON.stringify(courses));
                localStorage.setItem('electivesList', JSON.stringify(electives));
                displayAllCourses();
            })
            .catch(error => console.error('Error fetching courses:', error));
    }

    // Toggle form visibility
    document.getElementById('showFormBtn').addEventListener('click', function() {
        const form = document.getElementById('courseForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        this.textContent = form.style.display === 'none' ? 'Add New Course' : 'Hide Form';
    });

    // Display all courses
    function displayAllCourses() {
        const courseContainer = document.querySelector("[data-yh-object='courses']");
        courseContainer.innerHTML = ''; // Clear existing content

        // Combine core and elective courses for display
        let allCourses = [...courses];
        for (let category in electives) {
            allCourses = [...allCourses, ...electives[category]];
        }

        allCourses.forEach((course, index) => {
            let row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" class="form-control" value="${course.courseCode}" readonly></td>
                <td><input type="text" class="form-control" value="${course.courseName}"></td>
                <td><input type="text" class="form-control" value="${course.credits}"></td>
                <td>
                    <button type="button" class="btn btn-danger" onclick="deleteCourse(${index})">Delete</button>
                    <button type="button" class="btn btn-warning" onclick="editCourse(${index})">Edit</button>
                </td>
            `;
            courseContainer.appendChild(row);
        });
    }

    // Delete a course
    window.deleteCourse = function(index) {
        if (confirm("Are you sure you want to delete this course?")) {
            if (index < courses.length) {
                courses.splice(index, 1);
            } else {
                let electiveIndex = index - courses.length;
                for (let category in electives) {
                    if (electiveIndex < electives[category].length) {
                        electives[category].splice(electiveIndex, 1);
                        break;
                    }
                    electiveIndex -= electives[category].length;
                }
            }

            localStorage.setItem('courseList', JSON.stringify(courses));
            localStorage.setItem('electivesList', JSON.stringify(electives));
            displayAllCourses(); // Refresh the course list
            alert('Course deleted successfully.');
        }
    };

    // Edit a course
    window.editCourse = function(index) {
        let course;
        if (index < courses.length) {
            course = courses[index];
        } else {
            let electiveIndex = index - courses.length;
            for (let category in electives) {
                if (electiveIndex < electives[category].length) {
                    course = electives[category][electiveIndex];
                    break;
                }
                electiveIndex -= electives[category].length;
            }
        }

        document.getElementById('cc').value = course.courseCode || '';
        document.getElementById('cn').value = course.courseName || '';
        document.getElementById('ccre').value = course.credits || '';
        document.getElementById('des').value = course.details ? course.details.description : '';

        document.getElementById('submit').style.display = 'none';
        document.getElementById('update').style.display = 'block';

        document.getElementById('update').onclick = function() {
            updateCourse(index);
        };
    };

    // Update a course
    function updateCourse(index) {
        if (validateForm()) {
            let courseData = {
                courseCode: document.getElementById('cc').value,
                courseName: document.getElementById('cn').value,
                credits: document.getElementById('ccre').value,
                details: {
                    description: document.getElementById('des').value
                }
            };

            if (index < courses.length) {
                courses[index] = courseData;
            } else {
                let electiveIndex = index - courses.length;
                for (let category in electives) {
                    if (electiveIndex < electives[category].length) {
                        electives[category][electiveIndex] = courseData;
                        break;
                    }
                    electiveIndex -= electives[category].length;
                }
            }

            localStorage.setItem('courseList', JSON.stringify(courses));
            localStorage.setItem('electivesList', JSON.stringify(electives));
            displayAllCourses(); // Refresh the course list
            document.getElementById('submit').style.display = 'block';
            document.getElementById('update').style.display = 'none';
            resetForm();
            alert('Course updated successfully.');
        }
    }

    // Add a new course
    document.getElementById('submit').onclick = function() {
        if (validateForm()) {
            const courseType = document.getElementById('type').value;
            let category = document.getElementById('category').value;

            // Allow adding a new category if selected as 'other'
            if (category === 'other') {
                category = document.getElementById('newCategory').value.trim();
                if (!category) {
                    alert('Please enter a new category name.');
                    return;
                }
                if (!electives[category]) {
                    electives[category] = [];
                }
            }

            const newCourse = {
                courseCode: document.getElementById('cc').value,
                courseName: document.getElementById('cn').value,
                credits: document.getElementById('ccre').value,
                type: courseType,
                category: category,
                details: {
                    description: document.getElementById('des').value
                }
            };

            // Check for duplicate course code
            if (isDuplicateCourse(newCourse.courseCode)) {
                alert('A course with this course code already exists.');
                return;
            }

            if (courseType === 'core') {
                courses.push(newCourse);
            } else if (courseType === 'elective' && category) {
                if (!electives[category]) {
                    electives[category] = [];
                }
                electives[category].push(newCourse);
            }

            // Update the local storage and UI
            localStorage.setItem('courseList', JSON.stringify(courses));
            localStorage.setItem('electivesList', JSON.stringify(electives));
            displayAllCourses();
            resetForm(); // Reset the form after adding the course
            alert('Course added successfully.');
        }
    };

    // Check for duplicate course codes
    function isDuplicateCourse(courseCode) {
        if (courses.some(course => course.courseCode === courseCode)) {
            return true;
        }
        for (let category in electives) {
            if (electives[category].some(course => course.courseCode === courseCode)) {
                return true;
            }
        }
        return false;
    }

    // Form validation
    function validateForm() {
        const ccode = document.getElementById("cc").value;
        const cname = document.getElementById("cn").value;
        const ccre = document.getElementById("ccre").value;
        const des = document.getElementById("des").value;

        if (ccode === "") {
            alert("Please enter Course Code");
            return false;
        }
        if (cname === "") {
            alert("Please enter Course Name");
            return false;
        }
        if (ccre === "") {
            alert("Please enter Course Credits");
            return false;
        } else if (ccre < 1 || ccre > 4) {
            alert("Course credits must be between 1 and 4");
            return false;
        }
        if (des === "") {
            alert("Please enter Description");
            return false;
        }
        return true;
    }

    // Toggle category fields based on course type
    document.getElementById('type').addEventListener('change', function() {
        if (this.value === 'elective') {
            document.getElementById('categoryContainer').style.display = 'block';
        } else {
            document.getElementById('categoryContainer').style.display = 'none';
            document.getElementById('newCategoryContainer').style.display = 'none';
        }
    });

    // Show new category input field if "other" is selected
    document.getElementById('category').addEventListener('change', function() {
        if (this.value === 'other') {
            document.getElementById('newCategoryContainer').style.display = 'block';
        } else {
            document.getElementById('newCategoryContainer').style.display = 'none';
        }
    });

    // Reset form fields
    function resetForm() {
        document.getElementById('cc').value = '';
        document.getElementById('cn').value = '';
        document.getElementById('ccre').value = '';
        document.getElementById('lct').value = '';
        document.getElementById('lbch').value = '';
        document.getElementById('pre').value = '';
        document.getElementById('rep').value = '';
        document.getElementById('type').value = '';
        document.getElementById('category').value = '';
        document.getElementById('newCategory').value = '';
        document.getElementById('note').value = '';
        document.getElementById('tccns').value = '';
        document.getElementById('add').value = '';
        document.getElementById('des').value = '';
        document.getElementById('categoryContainer').style.display = 'none';
        document.getElementById('newCategoryContainer').style.display = 'none';
    }

    // Filter courses based on selection
    document.getElementById('searchType').addEventListener('change', function() {
        const selectedType = this.value;
        const categoryContainer = document.getElementById('searchCategoryContainer');
        if (selectedType === 'elective') {
            categoryContainer.style.display = 'block';
        } else {
            categoryContainer.style.display = 'none';
            filterCourses(selectedType, null);
        }
    });

    document.getElementById('searchCategory').addEventListener('change', function() {
        const selectedCategory = this.value;
        filterCourses('elective', selectedCategory);
    });

    // Filter courses based on type and category
    function filterCourses(type, category) {
        let filteredCourses = [];
        if (type === 'core') {
            filteredCourses = courses.filter(course => course.type === 'core');
        } else if (type === 'elective') {
            filteredCourses = courses.filter(course => course.type === 'elective' && course.category === category);
        } else {
            filteredCourses = [...courses, ...Object.values(electives).flat()]; // Show all if 'all' is selected
        }
        displayFilteredCourses(filteredCourses);
    }

    // Display filtered courses
    function displayFilteredCourses(filteredCourses) {
        const courseContainer = document.querySelector("[data-yh-object='courses']");
        courseContainer.innerHTML = ''; // Clear existing content
        filteredCourses.forEach((course, index) => {
            let row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" class="form-control" value="${course.courseCode}" readonly></td>
                <td><input type="text" class="form-control" value="${course.courseName}"></td>
                <td><input type="text" class="form-control" value="${course.credits}"></td>
                <td>
                    <button type="button" class="btn btn-danger" onclick="deleteCourse(${index})">Delete</button>
                    <button type="button" class="btn btn-warning" onclick="editCourse(${index})">Edit</button>
                </td>
            `;
            courseContainer.appendChild(row);
        });
    }
});
