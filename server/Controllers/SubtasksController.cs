using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Context;
using server.Models;

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubtasksController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public SubtasksController(ApplicationContext context)
        {
            _context = context;
        }

        // GET: api/Subtasks
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Subtask>>> GetSubtask()
        {
            if (_context.Subtasks == null)
            {
                return NotFound("Subtasks not found.");
            }
            return await _context.Subtasks.ToListAsync() ?? new List<Subtask>();
        }

        // GET: api/Subtasks/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Subtask>> GetSubtask(Guid id)
        {
            if (_context.Subtasks == null)
            {
                return NotFound("Subtasks not found.");
            }
            var subtask = await _context.Subtasks.FindAsync(id);

            if (subtask == null)
            {
                return NotFound($"Subtask with id {id} not found.");
            }

            return Ok(subtask);
        }

        // PUT: api/Subtasks/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSubtask(Guid id, Subtask subtask)
        {
            if (id != subtask.Id)
            {
                return BadRequest("The provided id does not match the subtask id.");
            }

            if (!SubtaskExists(id))
            {
                return NotFound($"Subtask with id {id} not found.");
            }

            _context.Entry(subtask).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SubtaskExists(id))
                    return NotFound($"Subtask with id {id} no longer exists.");
                throw;
            }

            var subtasks = _context.Subtasks.Where(s => s.TaskId == subtask.TaskId);

            // Check if at least one subtask is incomplete
            var anySubtaskIncomplete = subtasks.Any(s => !s.IsCompleted);
            // Check if all subtasks are completed
            var allSubtasksCompleted = !anySubtaskIncomplete;

            // Update the status of the associated task
            var taskToUpdate = await _context.Tasks.FindAsync(subtask.TaskId);

            if (taskToUpdate != null)
            {
                taskToUpdate.Status = allSubtasksCompleted ? Status.Completed : Status.Incomplete;
                await _context.SaveChangesAsync();
            }


            return NoContent();
        }

        // POST: api/Subtasks
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Subtask>> PostSubtask(Subtask subtask)
        {
            if (_context.Subtasks == null)
            {
                return Problem("Entity set 'ApplicationContext.Subtask' is null.");
            }

            if (subtask == null)
            {
                return BadRequest("Subtask data is invalid.");
            }

            _context.Subtasks.Add(subtask);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetSubtask", new { id = subtask.Id }, subtask);
        }
        // DELETE: api/Subtasks/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubtask(Guid id)
        {
            if (_context.Subtasks == null)
            {
                return NotFound("Subtasks not found.");
            }
            var subtask = await _context.Subtasks.FindAsync(id);
            if (subtask == null)
            {
                return NotFound($"Subtask with id {id} not found.");
            }

            _context.Subtasks.Remove(subtask);
            await _context.SaveChangesAsync();

            return Ok($"Subtask with id {id} has been deleted.");
        }

        private bool SubtaskExists(Guid id)
        {
            return (_context.Subtasks?.Any(e => e.Id == id)).GetValueOrDefault();
        }
    }
}
