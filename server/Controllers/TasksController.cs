using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Context;
using server.Models;
using server.Services;
using System.Globalization;
using Task = System.Threading.Tasks.Task;
using Subtask = server.Models.Subtask;
using Label = server.Models.Label;
using TaskModel = server.Models.Task;


namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly ApplicationContext _context;
        private readonly IUserService _userService;

        public TasksController(ApplicationContext context, IUserService userService)
        {
            _context = context;
            _userService = userService;
        }

        // GET: api/Tasks
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskModel>>> GetTasks(
            [FromQuery] Guid? listId = null,
            [FromQuery] Guid? labelId = null,
            [FromQuery] Guid? projectId = null,
            [FromQuery] string? dueDate = null,
            [FromQuery] bool unsorted = false,
            [FromQuery] bool upcoming = false,
            [FromQuery] bool overdue = false,
            [FromQuery] bool pending = false,
            [FromQuery] bool incomplete = false,
            [FromQuery] bool completed = false
            )
        {
            IQueryable<TaskModel> tasksQuery = _context.Tasks ?? throw new InvalidOperationException("Entity set 'ApplicationContext.Tasks' is null.");
            
            if (listId.HasValue)
            {
                tasksQuery = tasksQuery.Where(task => task.ListId == listId);
            }

            if (projectId.HasValue)
            {
                tasksQuery = tasksQuery.Where(task => task.ProjectId == projectId);
            }

            if (labelId.HasValue)
            {
                // Tasks with a specific label
                tasksQuery = tasksQuery.Where(task => task.Labels.Any(label => label.Id == labelId.Value));
            }

            if (unsorted == true)
            {
                tasksQuery = tasksQuery.Where(task => task.ListId == null);
            }

            if (upcoming == true)
            {
                // Filter tasks that are upcoming (due date is after today and task is not completed)
                tasksQuery = tasksQuery
                    .Where(task => task.DueDate.HasValue && task.DueDate.Value > DateTime.UtcNow && task.Status == Status.Incomplete)
                    .OrderBy(task => task.DueDate ?? DateTime.MaxValue);
            }

            if (overdue == true)
            {
                // Filter tasks that are overdue (due date is before today and task is not completed)
                tasksQuery = tasksQuery
                    .Where(task => task.DueDate.HasValue && task.DueDate.Value < DateTime.UtcNow && task.Status == Status.Incomplete);
            }

            if (incomplete == true)
            {
                tasksQuery = tasksQuery.Where(task =>
                    task.Status == Status.Incomplete && 
                    !task.Subtasks.Any(subtask => subtask.IsCompleted));
            }

            if (pending == true)
            {
                tasksQuery = tasksQuery.Where(task =>
                    task.Status != Status.Completed &&
                    task.Subtasks.Any(subtask => subtask.IsCompleted));
            }

            if (completed == true)
            {
                tasksQuery = tasksQuery
                    .Where(task => task.Status == Status.Completed);
            }

            if (!string.IsNullOrEmpty(dueDate))
            {
                DateTime parsedDueDate = DateTime.ParseExact(dueDate, "dd-MM-yyyy", CultureInfo.InvariantCulture);

                tasksQuery = tasksQuery
                    .Where(task => task.DueDate.HasValue && task.DueDate.Value.Date == parsedDueDate.Date);
            }

            var tasks = await tasksQuery
                .Include(t => t.Labels)
                .Include(t => t.Subtasks)
                .ToListAsync();

            return tasks;
        }

        // GET: api/Tasks/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TaskModel>> GetTask(Guid id)
        {
            if (_context.Tasks is null)
            {
                return NotFound();
            }
            var task = await _context.Tasks
                .Include(t => t.Labels)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
            {
                return NotFound();
            }

            return task;
        }

        // PUT: api/Tasks/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutTask(Guid id, TaskModel task)
        {
            if (id != task.Id)
            {
                return BadRequest("Bad request");
            }

            if (!IsAuthorized(id))
            {
                return Unauthorized("Unauthorized.");
            }

            task.UserId = _userService.GetUserId();

            _context.Entry(task).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();

                var updatedTask = await _context.Tasks.FindAsync(id);

                if (updatedTask == null)
                {
                    return NotFound();
                }

                return Ok(updatedTask);
            }

            catch (DbUpdateConcurrencyException)
            {
                if (!TaskExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<TaskModel>> PostTask(TaskModel task)
        {
            if (_context.Tasks is null)
            {
                return Problem("Entity set 'ApplicationContext.Task' is null.");
            }

            task.UserId = _userService.GetUserId();

            if (string.IsNullOrWhiteSpace(task.Name))
            {
                return BadRequest("Name field is required.");
            }

            try
            {
                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

                return CreatedAtAction("GetTask", new { id = task.Id }, task);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex);
            }
        }
        // DELETE: api/Tasks/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteTask(Guid id)
        {

            var task = await _context.Tasks
                .Include(t => t.Labels)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
            {
                return NotFound("Task not found.");
            }

            if (!IsAuthorized(id))
            {
                return Unauthorized("You are not authorized to delete this task.");
            }

            try
            {
                // Remove the task (labels will be handled by cascade delete)
                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Tasks/2/Subtask
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost("{id}/subtask")]
        public async Task<ActionResult<Models.Subtask>> PostSubtask(Guid id, Models.Subtask subtask)
        {
            if (_context.Subtasks is null)
            {
                return Problem("Entity set 'ApplicationContext.Subtask'  is null.");
            }

            subtask.TaskId = id;
            subtask.UserId = _userService.GetUserId();

            try
            {
                _context.Subtasks.Add(subtask);
                await _context.SaveChangesAsync();

                // Manually create CreatedAt response
                var locationUri = new Uri($"/api/Subtasks/{subtask.Id}", UriKind.Relative);
                return Created(locationUri, subtask);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        // POST: api/Tasks/2/RecurringTask
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost("{id}/recurring_task")]
        [Authorize]
        public async Task<ActionResult<Models.RecurringTask>> PostRecurringTask(Guid id, Models.RecurringTask recurringTask)
        {
            if (_context.RecurringTasks is null)
            {
                return Problem("Entity set 'ApplicationContext.RecurringTask'  is null.");
            }

            recurringTask.Id = id;

            _context.RecurringTasks.Add(recurringTask);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetRecurringTask", new { id = recurringTask.Id }, recurringTask);
        }

        // POST: api/TaskLabels
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost("{taskId}/labels/{labelId}")]
        [Authorize]
        public async Task<ActionResult> AddLabelToTask([FromRoute] Guid taskId, [FromRoute] Guid labelId)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(taskId);
                var label = await _context.Labels.FindAsync(labelId);

                if (task == null || label == null)
                {
                    return BadRequest("Invalid task or label.");
                }

                if (task.Labels == null)
                {
                    task.Labels = new List<Label>();
                }

                if (!task.Labels.Contains(label))
                {
                    task.Labels.Add(label);
                    await _context.SaveChangesAsync();
                    return Ok("Label added to the task successfully.");
                }
                else
                {
                    return BadRequest("Label is already associated with the task.");
                }
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }


        // DELETE: api/TaskLabels/5
        [HttpDelete("{taskId}/labels/{labelId}")]
        [Authorize]
        public async Task<IActionResult> RemoveLabelFromTask(Guid taskId, Guid labelId)
        {

            // Find the task based on taskId
            var task = await _context.Tasks
                .Include(t => t.Labels)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                return NotFound("Task not found.");
            }

            // Find the label based on labelId
            var label = await _context.Labels.FindAsync(labelId);

            if (label == null)
            {
                return NotFound("Label not found.");
            }

            // Check if the label is associated with the task before removing
            if (task.Labels != null && task.Labels.Contains(label))
            {
                // Remove the label from the task's Labels collection
                task.Labels.Remove(label);

                await _context.SaveChangesAsync();

                return NoContent();
            }
            else
            {
                return BadRequest("Cannot remove a label that has not been added to the task.");
            }
        }


        private bool TaskExists(Guid id)
        {
            return _context.Tasks.Any(e => e.Id == id);
        }

        private bool IsAuthorized(Guid taskId)
        {
            Guid userId = _userService.GetUserId();
            return _context.Tasks.Any(t => t.Id == taskId && t.UserId == userId);
        }
    }
}